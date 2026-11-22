<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\FaqResource;
use App\Http\Resources\PartnerResource;
use App\Http\Resources\PublicGatewayResource;
use App\Http\Resources\TierResource;
use App\Models\BusinessCategory;
use App\Models\CmsContent;
use App\Models\Faq;
use App\Models\MembershipTier;
use App\Models\Partner;
use App\Models\PaymentGateway;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicController extends Controller
{
    /** All public CMS content in every locale, so the SPA can switch language instantly. */
    public function content(): JsonResponse
    {
        return response()->json([
            'settings' => [
                'site_name' => Setting::get('site.name', config('app.name')),
                'contact_email' => Setting::get('contact.email'),
                'contact_phone' => Setting::get('contact.phone'),
                'social' => (object) (Setting::get('social') ?: []),
                'contact_extra' => Setting::get('contact.extra') ?: [],
                'currency' => config('portal.currency'),
                'logo_url' => Setting::assetUrl('site.logo'),
            ],
            'content' => CmsContent::query()->orderBy('sort_order')->get()->mapWithKeys(fn ($c) => [$c->key => $c->value]),
            'hero_slides' => \App\Http\Resources\HeroSlideResource::collection(\App\Models\HeroSlide::query()->active()->get()),
            'faqs' => FaqResource::collection(Faq::query()->where('is_active', true)->orderBy('sort_order')->get()),
            'stats' => [
                'partners' => Partner::query()->active()->count(),
                'offers' => \App\Models\Offer::query()->available()->count(),
                'members' => User::query()->where('is_staff', false)->count(),
            ],
        ]);
    }

    public function tiers(): AnonymousResourceCollection
    {
        return TierResource::collection(
            MembershipTier::query()->active()
                ->withCount(['offers' => fn ($q) => $q->available()])
                ->orderBy('priority')->get()
        );
    }

    public function categories(): AnonymousResourceCollection
    {
        return CategoryResource::collection(
            BusinessCategory::query()->withCount(['partners' => fn ($q) => $q->active()])->orderBy('sort_order')->get()
        );
    }

    /** Searchable partner directory with their currently available offers and unlocking tiers. */
    public function partners(Request $request): AnonymousResourceCollection
    {
        $search = trim((string) $request->query('search'));

        $partners = Partner::query()->active()
            ->with(['category', 'offers' => fn ($q) => $q->available()->with('tiers:id,name,color,priority')])
            ->when($request->integer('category'), fn ($q, $c) => $q->where('business_category_id', $c))
            ->when($request->integer('tier'), fn ($q, $t) => $q->whereHas('offers', fn ($o) => $o->available()->whereHas('tiers', fn ($x) => $x->whereKey($t))))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('name->en', 'like', "%{$search}%")
                ->orWhere('name->si', 'like', "%{$search}%")
                ->orWhere('name->ta', 'like', "%{$search}%")
                ->orWhere('city', 'like', "%{$search}%")
                ->orWhereHas('offers', fn ($o) => $o->where('title->en', 'like', "%{$search}%"))))
            ->orderByDesc('is_featured')
            ->orderBy('name->en')
            ->paginate(min($request->integer('per_page', 12), 48));

        return PartnerResource::collection($partners);
    }

    public function gateways(): AnonymousResourceCollection
    {
        return PublicGatewayResource::collection(
            PaymentGateway::query()->active()->orderByDesc('is_default')->orderBy('sort_order')->get()
        );
    }

    /** QR-code verification for partner staff. Exposes only what a cashier needs. */
    public function verify(string $token): JsonResponse
    {
        $user = User::query()->where('card_token', $token)->with('activeMembership.tier')->first();

        if (! $user) {
            return response()->json(['valid' => false, 'message' => 'Card not recognised.'], 404);
        }

        $m = $user->activeMembership;

        return response()->json([
            'valid' => (bool) $m && $user->status === 'active',
            'member' => [
                'name' => $user->name,
                'member_code' => $user->member_code,
                'status' => $user->status === 'suspended' ? 'suspended' : ($m ? 'active' : 'expired'),
                'tier' => $m ? ['name' => $m->tier->name, 'color' => $m->tier->color] : null,
                'expires_at' => $m?->expires_at?->toIso8601String(),
            ],
        ]);
    }
}
