<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\OfferRequest;
use App\Http\Requests\PartnerRequest;
use App\Http\Resources\OfferResource;
use App\Http\Resources\PartnerResource;
use App\Models\Offer;
use App\Models\Partner;
use App\Repositories\OfferRepository;
use App\Repositories\PartnerRepository;
use App\Services\AuditLogger;
use App\Services\CatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** Partner businesses and their offers. */
class PartnerController extends Controller
{
    public function __construct(private readonly CatalogService $catalog) {}

    public function index(Request $request, PartnerRepository $repo): AnonymousResourceCollection
    {
        return PartnerResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            $q->withCount('offers');
            if ($c = $request->integer('category')) {
                $q->where('business_category_id', $c);
            }
            if ($request->filled('status')) {
                $q->where('is_active', $request->query('status') === 'active');
            }
        }));
    }

    /** Lightweight list for select inputs. */
    public function options(): JsonResponse
    {
        return response()->json([
            'data' => Partner::query()->orderBy('name->en')->get(['id', 'name', 'is_active'])
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'is_active' => $p->is_active]),
        ]);
    }

    public function show(Partner $partner): PartnerResource
    {
        Gate::authorize('view', $partner);

        return new PartnerResource($partner->load(['category', 'branches', 'offers.tiers']));
    }

    public function store(PartnerRequest $request): PartnerResource
    {
        Gate::authorize('create', Partner::class);

        return new PartnerResource($this->catalog->savePartner(null, $request->validated(), $request->file('logo')));
    }

    public function update(PartnerRequest $request, Partner $partner): PartnerResource
    {
        Gate::authorize('update', $partner);

        return new PartnerResource($this->catalog->savePartner($partner, $request->validated(), $request->file('logo')));
    }

    public function destroy(Partner $partner): JsonResponse
    {
        Gate::authorize('delete', $partner);
        $this->catalog->deletePartner($partner);

        return response()->json(['message' => 'Partner deleted']);
    }

    // Offers

    public function offers(Request $request, OfferRepository $repo): AnonymousResourceCollection
    {
        return OfferResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            if ($p = $request->integer('partner')) {
                $q->where('partner_id', $p);
            }
            if ($t = $request->integer('tier')) {
                $q->whereHas('tiers', fn ($x) => $x->whereKey($t));
            }
            if ($request->filled('status')) {
                match ($request->query('status')) {
                    'active' => $q->available(),
                    'inactive' => $q->where('is_active', false),
                    'expired' => $q->whereNotNull('ends_at')->where('ends_at', '<', now()->toDateString()),
                    default => null,
                };
            }
        }));
    }

    public function storeOffer(OfferRequest $request): OfferResource
    {
        Gate::authorize('create', Offer::class);

        return new OfferResource($this->catalog->saveOffer(null, $request->validated())->load('partner.category'));
    }

    public function updateOffer(OfferRequest $request, Offer $offer): OfferResource
    {
        Gate::authorize('update', $offer);

        return new OfferResource($this->catalog->saveOffer($offer, $request->validated())->load('partner.category'));
    }

    public function destroyOffer(Offer $offer, AuditLogger $audit): JsonResponse
    {
        Gate::authorize('delete', $offer);
        $audit->log('offer.deleted', 'Deleted offer '.$offer->translate('title', 'en'), $offer);
        $offer->delete();

        return response()->json(['message' => 'Offer deleted']);
    }
}
