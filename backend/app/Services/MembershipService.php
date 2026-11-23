<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Membership;
use App\Models\MembershipTier;
use App\Models\User;
use App\Services\Sms\SmsService;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MembershipService
{
    public function __construct(
        private readonly SmsService $sms,
        private readonly AuditLogger $audit,
        private readonly MemberCardService $cards,
    ) {}

    /** Assigns a permanent member ID (JHMS 1251 3428) and QR card token if missing. */
    public function ensureMemberIdentity(User $user): User
    {
        $dirty = false;
        if (! $user->member_code) {
            $user->member_code = self::newMemberCode();
            $dirty = true;
        }
        if (! $user->card_token) {
            $user->card_token = (string) Str::uuid();
            $dirty = true;
        }
        if ($dirty) {
            $user->save();
        }

        return $user;
    }

    /**
     * A fresh, unused member ID in the card's printed format: prefix + 8 digits in two groups of four
     * ("JHMS 1251 3428"). Digits are random (not a running count) so IDs don't reveal how many members
     * there are or let anyone guess a neighbour's ID. Stored with the spaces, exactly as printed.
     */
    public static function newMemberCode(): string
    {
        $prefix = strtoupper(trim((string) config('portal.member_code_prefix', 'JHMS')));
        do {
            $digits = (string) random_int(10_000_000, 99_999_999);
            $code = sprintf('%s %s %s', $prefix, substr($digits, 0, 4), substr($digits, 4));
        } while (User::query()->where('member_code', $code)->exists());

        return $code;
    }

    /** True when a code already follows the current printed format. */
    public static function isCurrentMemberCode(?string $code): bool
    {
        $prefix = preg_quote(strtoupper(trim((string) config('portal.member_code_prefix', 'JHMS'))), '/');

        return (bool) preg_match("/^{$prefix} \\d{4} \\d{4}$/", (string) $code);
    }

    /** Determines whether a purchase of $tier is new, a renewal, or an upgrade for this user. */
    public function purchaseType(User $user, MembershipTier $tier): string
    {
        $current = $user->activeMembership()->with('tier')->first();
        if (! $current) {
            return 'new';
        }

        return $current->membership_tier_id === $tier->id ? 'renewal' : 'upgrade';
    }

    /**
     * Activates (or extends) membership for a paid invoice. Must be called inside the payment transaction.
     * Renewal extends from the current expiry; upgrade/new start now.
     */
    public function activateFromInvoice(Invoice $invoice): Membership
    {
        $user = $invoice->user;
        $tier = $invoice->tier;
        $current = $user->activeMembership()->lockForUpdate()->first();

        if ($current && $current->membership_tier_id === $tier->id) {
            $current->update([
                'expires_at' => $tier->expiryFrom($current->expires_at),
                'source' => 'renewal',
                'reminder_sent_at' => null,
            ]);
            $membership = $current->refresh();
            $event = 'membership_renewed';
        } else {
            if ($current) {
                $current->update(['status' => 'cancelled', 'notes' => "Superseded by invoice {$invoice->number}"]);
            }
            $start = now();
            $membership = Membership::query()->create([
                'user_id' => $user->id,
                'membership_tier_id' => $tier->id,
                'status' => 'active',
                'source' => 'payment',
                'starts_at' => $start,
                'expires_at' => $tier->expiryFrom($start),
            ]);
            $event = 'membership_activated';
        }

        $invoice->membership()->associate($membership)->save();
        $this->ensureMemberIdentity($user);

        $cardReason = $event === 'membership_renewed' ? 'renewed' : ($current ? 'upgraded' : 'new');
        DB::afterCommit(fn () => $this->cards->queueForMembership($user, $cardReason));
        DB::afterCommit(fn () => $this->sms->sendEvent($event, $user->fresh(), $this->smsVars($membership)));

        return $membership;
    }

    /** Admin override: grant/replace/extend/cancel a membership without payment. */
    public function override(User $user, array $data): ?Membership
    {
        return DB::transaction(function () use ($user, $data) {
            $current = $user->activeMembership()->lockForUpdate()->first();
            $before = $current?->only(['membership_tier_id', 'status', 'starts_at', 'expires_at']);

            if (($data['status'] ?? 'active') === 'cancelled') {
                $current?->update(['status' => 'cancelled', 'notes' => $data['notes'] ?? 'Cancelled by admin']);
                $this->audit->log('membership.override', "Cancelled membership for {$user->name}", $user, ['before' => $before, 'notes' => $data['notes'] ?? null]);

                return $current?->refresh();
            }

            $tier = MembershipTier::query()->findOrFail($data['membership_tier_id']);
            $start = isset($data['starts_at']) ? Carbon::parse($data['starts_at']) : now();
            $expires = isset($data['expires_at']) ? Carbon::parse($data['expires_at'])->endOfDay() : $tier->expiryFrom($start);

            if ($current) {
                $current->update(['status' => 'cancelled', 'notes' => 'Replaced by manual override']);
            }

            $membership = Membership::query()->create([
                'user_id' => $user->id,
                'membership_tier_id' => $tier->id,
                'status' => 'active',
                'source' => 'manual',
                'starts_at' => $start,
                'expires_at' => $expires,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->ensureMemberIdentity($user);
            DB::afterCommit(fn () => $this->cards->queueForMembership($user, 'override'));

            $this->audit->log('membership.override', "Manual membership override for {$user->name} → {$tier->translate('name', 'en')} until {$expires->toDateString()}", $user, [
                'before' => $before,
                'after' => $membership->only(['membership_tier_id', 'status', 'starts_at', 'expires_at']),
                'notes' => $data['notes'] ?? null,
            ]);

            if (! empty($data['notify'])) {
                DB::afterCommit(fn () => $this->sms->sendEvent('membership_activated', $user->fresh(), $this->smsVars($membership)));
            }

            return $membership;
        });
    }

    public function expireOverdue(): int
    {
        return Membership::query()
            ->where('status', 'active')
            ->where('expires_at', '<=', now())
            ->update(['status' => 'expired', 'updated_at' => now()]);
    }

    public function sendExpiryReminders(int $days = 7): int
    {
        $count = 0;

        Membership::query()
            ->with(['user', 'tier'])
            ->where('status', 'active')
            ->whereNull('reminder_sent_at')
            ->whereBetween('expires_at', [now(), now()->addDays($days)->endOfDay()])
            ->chunkById(200, function ($memberships) use (&$count) {
                foreach ($memberships as $membership) {
                    $this->sms->sendEvent('expiry_reminder', $membership->user, $this->smsVars($membership));
                    $membership->update(['reminder_sent_at' => now()]);
                    $count++;
                }
            });

        return $count;
    }

    public function smsVars(Membership $membership): array
    {
        $membership->loadMissing('tier', 'user');
        $locale = $membership->user->preferred_locale ?? 'en';

        return [
            'tier_name' => $membership->tier->translate('name', $locale),
            'expiry_date' => $membership->expires_at instanceof CarbonInterface ? $membership->expires_at->format('Y-m-d') : '',
        ];
    }
}
