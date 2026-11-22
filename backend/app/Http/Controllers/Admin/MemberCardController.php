<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MemberCard;
use App\Models\User;
use App\Services\MemberCardService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Card Management / Print Queue. Routes guarded by cards.view / cards.print / cards.issue. */
class MemberCardController extends Controller
{
    public function __construct(private readonly MemberCardService $cards) {}

    /** Members eligible for a card (active account + current membership), with card state. */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('search'));
        $perPage = min(max($request->integer('per_page', 15), 5), 100);

        $query = $this->eligibleQuery()
            ->with(['activeMembership.tier', 'card.printedBy:id,name', 'card.issuedBy:id,name'])
            ->when(in_array($status, ['pending', 'printed', 'issued'], true), function (Builder $q) use ($status) {
                $status === 'pending'
                    ? $q->where(fn ($w) => $w->whereDoesntHave('card')->orWhereHas('card', fn ($c) => $c->where('card_status', 'pending')))
                    : $q->whereHas('card', fn ($c) => $c->where('card_status', $status));
            })
            ->when($request->integer('tier'), fn ($q, $t) => $q->whereHas('activeMembership', fn ($m) => $m->where('membership_tier_id', $t)))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$search}%")->orWhere('member_code', 'like', "%{$search}%")
                ->orWhere('nic', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%")));

        $sort = in_array($request->query('sort'), ['name', 'member_code', 'created_at'], true) ? $request->query('sort') : 'created_at';
        $dir = $request->query('direction') === 'asc' ? 'asc' : 'desc';
        $page = $query->orderBy($sort, $dir)->orderBy('id', $dir)->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => $page->getCollection()->map(fn (User $u) => $this->row($u))->values(),
            'meta' => [
                'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage(),
                'total' => $page->total(), 'from' => $page->firstItem(), 'to' => $page->lastItem(),
            ],
            'counts' => $this->counts(),
        ]);
    }

    /** Validated card payloads for preview / print (does not change status). */
    public function sheet(Request $request): JsonResponse
    {
        $data = $request->validate(['user_ids' => ['required', 'array', 'min:1', 'max:200'], 'user_ids.*' => ['integer']]);

        return response()->json(['data' => $this->cards->sheet($data['user_ids'])]);
    }

    public function markPrinted(Request $request): JsonResponse
    {
        $data = $request->validate(['user_ids' => ['required', 'array', 'min:1', 'max:200'], 'user_ids.*' => ['integer']]);
        $result = $this->cards->markPrinted($data['user_ids'], $request->user());

        return response()->json(['message' => 'Cards marked as printed', 'counts' => $this->counts()] + $result);
    }

    public function markIssued(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:200'], 'user_ids.*' => ['integer'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);
        $count = $this->cards->markIssued($data['user_ids'], $request->user(), $data['note'] ?? null);

        return response()->json(['message' => "{$count} card(s) marked as issued", 'issued' => $count, 'counts' => $this->counts()]);
    }

    public function logs(User $member): JsonResponse
    {
        abort_if($member->is_staff, 404);
        $card = $member->card()->with(['logs.performer:id,name'])->first();

        return response()->json([
            'card' => $card ? $this->cardState($card) : null,
            'logs' => $card ? $card->logs->map(fn ($l) => [
                'id' => $l->id,
                'action' => $l->action,
                'by' => $l->performer?->name,
                'batch_ref' => $l->batch_ref,
                'snapshot' => $l->snapshot,
                'note' => $l->note,
                'created_at' => $l->created_at?->toIso8601String(),
            ])->values() : [],
        ]);
    }

    private function eligibleQuery(): Builder
    {
        return User::query()
            ->where('is_staff', false)
            ->where('status', 'active')
            ->whereHas('memberships', fn ($m) => $m->where('status', 'active')->where('expires_at', '>', now()));
    }

    private function counts(): array
    {
        $eligible = $this->eligibleQuery()->select('users.id');
        $byStatus = DB::table('member_cards')->whereIn('user_id', $eligible)->select('card_status', DB::raw('COUNT(*) as n'))->groupBy('card_status')->pluck('n', 'card_status');
        $total = (clone $eligible)->count();
        $withCard = (int) $byStatus->sum();

        return [
            'all' => $total,
            'pending' => (int) ($byStatus['pending'] ?? 0) + ($total - $withCard),
            'printed' => (int) ($byStatus['printed'] ?? 0),
            'issued' => (int) ($byStatus['issued'] ?? 0),
        ];
    }

    private function row(User $u): array
    {
        $m = $u->activeMembership;

        return [
            'user_id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'phone' => $u->phone,
            'nic' => $u->nic,
            'member_code' => $u->member_code,
            'tier' => $m ? ['id' => $m->tier->id, 'name' => $m->tier->name, 'color' => $m->tier->color] : null,
            'expires_at' => $m?->expires_at?->toIso8601String(),
            'joined_at' => $u->created_at?->toIso8601String(),
            'card' => $u->card ? $this->cardState($u->card) : ['card_status' => 'pending', 'pending_reason' => 'new', 'reprint_count' => 0, 'is_reprint' => false],
        ];
    }

    private function cardState(MemberCard $c): array
    {
        return [
            'card_status' => $c->card_status,
            'pending_reason' => $c->pending_reason,
            'card_printed_at' => $c->card_printed_at?->toIso8601String(),
            'card_printed_by' => $c->printedBy?->name,
            'issued_at' => $c->issued_at?->toIso8601String(),
            'issued_by' => $c->issuedBy?->name,
            'reprint_count' => $c->reprint_count,
            'is_reprint' => $c->hasBeenPrinted(),
        ];
    }
}
