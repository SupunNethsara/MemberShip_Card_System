<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MemberRequest;
use App\Http\Requests\MembershipOverrideRequest;
use App\Http\Resources\InvoiceResource;
use App\Http\Resources\SmsLogResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\MembershipService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class MemberController extends Controller
{
    public function __construct(
        private readonly UserRepository $repo,
        private readonly UserService $users,
        private readonly MembershipService $memberships,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return UserResource::collection($this->repo->paginateMembers($request->all()));
    }

    public function store(MemberRequest $request): UserResource
    {
        $user = $this->users->registerMember($request->validated(), $request->boolean('send_welcome'));

        return new UserResource($user->load(['roles', 'activeMembership.tier']));
    }

    public function show(User $member): JsonResponse
    {
        abort_if($member->is_staff, 404);
        Gate::authorize('view', $member);

        $member->load(['roles', 'activeMembership.tier', 'memberships' => fn ($q) => $q->with('tier')->latest()]);

        return response()->json([
            'data' => new UserResource($member),
            'invoices' => InvoiceResource::collection($member->invoices()->with(['tier', 'gateway'])->latest()->limit(20)->get()),
            'sms' => SmsLogResource::collection(\App\Models\SmsLog::query()->with('gateway')->where('user_id', $member->id)->latest()->limit(20)->get()),
        ]);
    }

    public function update(MemberRequest $request, User $member): UserResource
    {
        abort_if($member->is_staff, 404);
        Gate::authorize('update', $member);

        return new UserResource($this->users->updateMember($member, $request->validated())->load(['roles', 'activeMembership.tier']));
    }

    public function destroy(Request $request, User $member): JsonResponse
    {
        abort_if($member->is_staff, 404);
        Gate::authorize('delete', $member);
        $this->users->delete($member, $request->user());

        return response()->json(['message' => 'Member deleted']);
    }

    public function override(MembershipOverrideRequest $request, User $member): JsonResponse
    {
        Gate::authorize('override', $member);
        $this->memberships->override($member, $request->validated());

        return response()->json([
            'message' => 'Membership updated',
            'data' => new UserResource($member->refresh()->load(['roles', 'activeMembership.tier'])),
        ]);
    }
}
