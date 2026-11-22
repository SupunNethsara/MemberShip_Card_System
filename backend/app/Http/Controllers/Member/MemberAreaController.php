<?php

namespace App\Http\Controllers\Member;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Http\Requests\SlipUploadRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\MembershipResource;
use App\Http\Resources\OfferResource;
use App\Models\Invoice;
use App\Models\Offer;
use App\Models\Setting;
use App\Services\Payments\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class MemberAreaController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user()->load(['activeMembership.tier']);
        $membership = $user->activeMembership;

        $unlocked = $membership
            ? Offer::query()->available()->whereHas('tiers', fn ($q) => $q->whereKey($membership->membership_tier_id))->count()
            : 0;

        return response()->json([
            'card' => [
                'name' => $user->name,
                'member_code' => $user->member_code,
                'verify_url' => $user->card_token ? config('portal.frontend_url').'/verify/'.$user->card_token : null,
                'member_since' => $user->created_at?->toIso8601String(),
            ],
            'membership' => $membership ? new MembershipResource($membership) : null,
            'history' => MembershipResource::collection($user->memberships()->with('tier')->latest()->limit(10)->get()),
            'stats' => [
                'unlocked_offers' => $unlocked,
                'total_offers' => Offer::query()->available()->count(),
                'invoices_paid' => $user->invoices()->where('status', 'paid')->count(),
                'awaiting_approval' => $user->invoices()->where('status', 'awaiting_approval')->count(),
            ],
        ]);
    }

    /** All available offers, flagged unlocked/locked for the member's current tier. */
    public function benefits(Request $request): AnonymousResourceCollection
    {
        $tierId = $request->user()->activeMembership?->membership_tier_id;
        $search = trim((string) $request->query('search'));

        $offers = Offer::query()->available()
            ->with(['partner.category', 'tiers:id,name,color,priority'])
            ->when($request->integer('category'), fn ($q, $c) => $q->whereHas('partner', fn ($p) => $p->where('business_category_id', $c)))
            ->when($request->query('scope') === 'unlocked', fn ($q) => $tierId ? $q->whereHas('tiers', fn ($t) => $t->whereKey($tierId)) : $q->whereRaw('1 = 0'))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('title->en', 'like', "%{$search}%")
                ->orWhere('title->si', 'like', "%{$search}%")
                ->orWhere('title->ta', 'like', "%{$search}%")
                ->orWhereHas('partner', fn ($p) => $p->where('name->en', 'like', "%{$search}%")->orWhere('city', 'like', "%{$search}%"))))
            ->latest()
            ->paginate(min($request->integer('per_page', 12), 48));

        $offers->getCollection()->each(fn ($o) => $o->is_unlocked = $tierId && $o->tiers->contains('id', $tierId));

        return OfferResource::collection($offers);
    }

    public function invoices(Request $request): AnonymousResourceCollection
    {
        return InvoiceResource::collection(
            $request->user()->invoices()->with(['tier', 'gateway', 'membership'])->latest()->paginate(min($request->integer('per_page', 10), 50))
        );
    }

    public function showInvoice(Invoice $invoice): InvoiceResource
    {
        Gate::authorize('view', $invoice);

        return new InvoiceResource($invoice->load(['tier', 'gateway', 'membership']));
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $result = $this->payments->checkout($request->user(), $request->integer('tier_id'), $request->integer('gateway_id') ?: null);

        return response()->json([
            'invoice' => new InvoiceResource($result['invoice']->load(['tier', 'gateway'])),
            'action' => $result['action'],
        ], 201);
    }

    public function uploadSlip(SlipUploadRequest $request, Invoice $invoice): InvoiceResource
    {
        Gate::authorize('uploadSlip', $invoice);

        return new InvoiceResource($this->payments->uploadSlip($invoice, $request->file('slip'))->load(['tier', 'gateway']));
    }

    /** Printable HTML receipt, served as a download. */
    public function receipt(Invoice $invoice): Response
    {
        Gate::authorize('view', $invoice);
        abort_unless($invoice->isPaid(), 422, 'Receipts are available for paid invoices only.');

        $invoice->load(['user', 'tier', 'gateway', 'membership']);
        $html = view('receipt', [
            'invoice' => $invoice,
            'siteName' => Setting::get('site.name', config('app.name')),
            'logoUrl' => Setting::assetUrl('site.logo'),
            'contactEmail' => Setting::get('contact.email'),
            'contactPhone' => Setting::get('contact.phone'),
        ])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="receipt-'.$invoice->number.'.html"',
        ]);
    }
}
