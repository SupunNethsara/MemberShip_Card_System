<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Requests\TierRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\TierResource;
use App\Models\BusinessCategory;
use App\Models\MembershipTier;
use App\Repositories\CategoryRepository;
use App\Repositories\TierRepository;
use App\Services\CatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** Membership tiers and business categories. */
class CatalogController extends Controller
{
    public function __construct(private readonly CatalogService $catalog) {}

    // Tiers

    public function tiers(Request $request, TierRepository $repo): AnonymousResourceCollection
    {
        $params = $request->all() + ['per_page' => 50];

        return TierResource::collection($repo->paginate($params, fn ($q) => $q->withCount([
            'offers',
            'memberships' => fn ($m) => $m->where('status', 'active')->where('expires_at', '>', now()),
        ])));
    }

    public function storeTier(TierRequest $request): TierResource
    {
        Gate::authorize('create', MembershipTier::class);

        return new TierResource($this->catalog->saveTier(null, $request->validated()));
    }

    public function updateTier(TierRequest $request, MembershipTier $tier): TierResource
    {
        Gate::authorize('update', $tier);

        return new TierResource($this->catalog->saveTier($tier, $request->validated()));
    }

    public function destroyTier(MembershipTier $tier): JsonResponse
    {
        Gate::authorize('delete', $tier);
        $this->catalog->deleteTier($tier);

        return response()->json(['message' => 'Tier deleted']);
    }

    // Categories

    public function categories(Request $request, CategoryRepository $repo): AnonymousResourceCollection
    {
        return CategoryResource::collection($repo->paginate($request->all() + ['per_page' => 100], fn ($q) => $q->withCount('partners')));
    }

    public function storeCategory(CategoryRequest $request): CategoryResource
    {
        Gate::authorize('create', BusinessCategory::class);

        return new CategoryResource($this->catalog->saveCategory(null, $request->validated()));
    }

    public function updateCategory(CategoryRequest $request, BusinessCategory $category): CategoryResource
    {
        Gate::authorize('update', $category);

        return new CategoryResource($this->catalog->saveCategory($category, $request->validated()));
    }

    public function destroyCategory(BusinessCategory $category): JsonResponse
    {
        Gate::authorize('delete', $category);
        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
