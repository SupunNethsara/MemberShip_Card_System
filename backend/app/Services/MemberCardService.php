<?php

namespace App\Services;

use App\Models\MemberCard;
use App\Models\MemberCardLog;
use App\Models\Setting;
use App\Models\User;
use App\Notifications\PortalNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Physical member card lifecycle: pending → printed → issued (→ pending again when details change).
 * Only members with an active account AND a current membership may have a card generated.
 */
class MemberCardService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function isEligible(User $user): bool
    {
        return ! $user->is_staff && $user->status === 'active' && $user->activeMembership()->exists();
    }

    /**
     * Called whenever a membership becomes active (new, renewal, upgrade, manual override).
     * Creates the card in `pending`; a card already printed/issued goes back to `pending`
     * because the tier / validity printed on it is now out of date.
     */
    public function queueForMembership(User $user, string $reason): MemberCard
    {
        $card = MemberCard::query()->firstOrNew(['user_id' => $user->id]);
        $isNew = ! $card->exists;

        if ($isNew || $card->card_status !== MemberCard::PENDING) {
            $card->fill(['card_status' => MemberCard::PENDING, 'pending_reason' => $isNew ? 'new' : $reason])->save();
            $this->log($card, 'queued', null, null, $isNew ? 'Card queued for printing' : "Reprint due ({$reason})");
        }

        return $card;
    }

    /** Validates a selection and returns everything the frontend needs to render the cards. */
    public function sheet(array $userIds): array
    {
        $users = $this->eligibleUsers($userIds);

        return $users->map(fn (User $u) => $this->payload($u))->values()->all();
    }

    /**
     * Marks cards as printed after the operator confirms the print run.
     * Previously printed cards count as reprints (reprint_count++).
     *
     * @return array{printed:int, reprinted:int, batch:string}
     */
    public function markPrinted(array $userIds, User $staff): array
    {
        $users = $this->eligibleUsers($userIds);
        $batch = 'B'.now()->format('ymdHis').Str::upper(Str::random(4));
        $printed = $reprinted = 0;

        DB::transaction(function () use ($users, $staff, $batch, &$printed, &$reprinted) {
            foreach ($users as $user) {
                $card = MemberCard::query()->lockForUpdate()->firstOrCreate(['user_id' => $user->id], ['card_status' => MemberCard::PENDING, 'pending_reason' => 'new']);
                $isReprint = $card->hasBeenPrinted();

                $card->fill([
                    'card_status' => MemberCard::PRINTED,
                    'pending_reason' => null,
                    'card_printed_at' => now(),
                    'card_printed_by' => $staff->id,
                    'issued_at' => null,
                    'issued_by' => null,
                    'reprint_count' => $card->reprint_count + ($isReprint ? 1 : 0),
                ])->save();

                $this->log($card, $isReprint ? 'reprinted' : 'printed', $staff, $batch, null, $this->snapshot($user));
                $isReprint ? $reprinted++ : $printed++;
            }
        });

        $this->audit->log('cards.printed', "Printed {$users->count()} member card(s) — batch {$batch}", null, [
            'batch' => $batch, 'printed' => $printed, 'reprinted' => $reprinted, 'members' => $users->pluck('member_code')->all(),
        ]);

        return compact('printed', 'reprinted', 'batch');
    }

    /** Marks printed cards as handed over to the member. */
    public function markIssued(array $userIds, User $staff, ?string $note = null): int
    {
        $cards = MemberCard::query()->with('user')->whereIn('user_id', $userIds)->get();
        $notPrinted = $cards->where('card_status', '!=', MemberCard::PRINTED);
        if ($cards->isEmpty() || $notPrinted->isNotEmpty() || $cards->count() !== count(array_unique($userIds))) {
            throw ValidationException::withMessages(['user_ids' => 'Only cards with status "Printed" can be marked as issued.']);
        }

        DB::transaction(function () use ($cards, $staff, $note) {
            foreach ($cards as $card) {
                $card->update(['card_status' => MemberCard::ISSUED, 'issued_at' => now(), 'issued_by' => $staff->id]);
                $this->log($card, 'issued', $staff, null, $note);
            }
        });

        foreach ($cards as $card) {
            if ($card->user) {
                PortalNotification::dispatchTo(
                    $card->user,
                    'Member Card Issued',
                    'Your physical membership card has been issued!',
                    'success',
                    '/member/dashboard',
                    'credit-card'
                );
            }
        }

        $this->audit->log('cards.issued', "Issued {$cards->count()} member card(s)", null, ['members' => $cards->pluck('user.member_code')->all(), 'note' => $note]);

        return $cards->count();
    }

    public function payload(User $user): array
    {
        $user->loadMissing(['activeMembership.tier', 'card']);
        $m = $user->activeMembership;

        return [
            'user_id' => $user->id,
            'name' => $user->name,
            'member_code' => $user->member_code,
            'nic' => $user->nic,
            'joined_at' => $user->created_at?->toIso8601String(),
            'expires_at' => $m?->expires_at?->toIso8601String(),
            'tier' => $m ? ['name' => $m->tier->name, 'color' => $m->tier->color] : null,
            'verify_url' => $user->card_token ? config('portal.frontend_url').'/verify/'.$user->card_token : null,
            'card_status' => $user->card?->card_status ?? MemberCard::PENDING,
            'is_reprint' => (bool) $user->card?->hasBeenPrinted(),
            'contact' => ['phone' => Setting::get('contact.phone'), 'email' => Setting::get('contact.email')],
        ];
    }

    /** @return Collection<int, User> */
    private function eligibleUsers(array $userIds): Collection
    {
        $ids = array_values(array_unique(array_map('intval', $userIds)));
        $users = User::query()->with(['activeMembership.tier', 'card'])->whereIn('id', $ids)->where('is_staff', false)->get();

        $ineligible = $users->reject(fn (User $u) => $u->status === 'active' && $u->activeMembership);
        $missing = count($ids) - $users->count();
        if ($users->isEmpty() || $ineligible->isNotEmpty() || $missing > 0) {
            $names = $ineligible->pluck('name')->take(5)->implode(', ');
            throw ValidationException::withMessages([
                'user_ids' => 'Cards can only be generated for members with an active account and a current membership.'.($names ? " Not eligible: {$names}." : ''),
            ]);
        }

        return $users->sortBy(fn ($u) => array_search($u->id, $ids, true))->values();
    }

    private function snapshot(User $user): array
    {
        $m = $user->activeMembership;

        return [
            'member_code' => $user->member_code,
            'tier' => $m?->tier?->translate('name', 'en'),
            'expires_at' => $m?->expires_at?->toDateString(),
        ];
    }

    private function log(MemberCard $card, string $action, ?User $staff, ?string $batch, ?string $note = null, ?array $snapshot = null): void
    {
        MemberCardLog::query()->create([
            'member_card_id' => $card->id,
            'user_id' => $card->user_id,
            'action' => $action,
            'performed_by' => $staff?->id,
            'batch_ref' => $batch,
            'snapshot' => $snapshot,
            'note' => $note,
        ]);
    }
}
