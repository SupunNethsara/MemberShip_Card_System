<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PermissionMatrixRequest;
use App\Http\Requests\RoleRequest;
use App\Http\Requests\StaffRequest;
use App\Http\Resources\RoleResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Services\RoleService;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/** Roles & Permissions matrix and staff accounts. */
class AccessController extends Controller
{
    public function __construct(
        private readonly RoleService $roles,
        private readonly UserService $users,
    ) {}

    /** Everything the Permission Matrix needs in one round-trip. */
    public function matrix(): JsonResponse
    {
        $permissions = Permission::query()->orderBy('sort_order')->get(['id', 'name', 'group', 'label']);

        return response()->json([
            'roles' => RoleResource::collection(Role::query()->with('permissions')->addSelect(['users_count' => DB::table('model_has_roles')->selectRaw('COUNT(*)')->whereColumn('model_has_roles.role_id', 'roles.id')])->orderByDesc('is_system')->orderBy('id')->get()),
            'groups' => $permissions->groupBy('group')->map(fn ($items, $group) => [
                'name' => $group,
                'permissions' => $items->map->only(['name', 'label'])->values(),
            ])->values(),
        ]);
    }

    public function saveMatrix(PermissionMatrixRequest $request): JsonResponse
    {
        $changes = $this->roles->syncMatrix($request->input('matrix'));

        return response()->json(['message' => 'Permissions saved', 'changes' => $changes] + $this->matrix()->getData(true));
    }

    public function storeRole(RoleRequest $request): RoleResource
    {
        Gate::authorize('create', Role::class);

        return new RoleResource($this->roles->create($request->validated())->load('permissions'));
    }

    public function updateRole(RoleRequest $request, Role $role): RoleResource
    {
        Gate::authorize('update', $role);

        return new RoleResource($this->roles->update($role, $request->validated())->load('permissions'));
    }

    public function destroyRole(Role $role): JsonResponse
    {
        Gate::authorize('delete', $role);
        $this->roles->delete($role);

        return response()->json(['message' => 'Role deleted']);
    }

    // Staff

    public function staff(Request $request, UserRepository $repo): AnonymousResourceCollection
    {
        return UserResource::collection($repo->paginateStaff($request->all()))->additional([
            'roles' => Role::query()->where('is_staff', true)->orderBy('id')->pluck('name'),
        ]);
    }

    public function storeStaff(StaffRequest $request): UserResource
    {
        $this->guardSuperAdminAssignment($request);

        return new UserResource($this->users->saveStaff(null, $request->validated()));
    }

    public function updateStaff(StaffRequest $request, User $staff): UserResource
    {
        abort_unless($staff->is_staff, 404);
        Gate::authorize('update', $staff);
        $this->guardSuperAdminAssignment($request);

        if ($staff->is($request->user()) && $staff->isSuperAdmin() && ! in_array('Super Admin', $request->input('roles', []), true)) {
            abort(422, 'You cannot remove the Super Admin role from yourself.');
        }

        return new UserResource($this->users->saveStaff($staff, $request->validated()));
    }

    public function destroyStaff(Request $request, User $staff): JsonResponse
    {
        abort_unless($staff->is_staff, 404);
        Gate::authorize('delete', $staff);
        $this->users->delete($staff, $request->user());

        return response()->json(['message' => 'Staff account deleted']);
    }

    private function guardSuperAdminAssignment(Request $request): void
    {
        if (in_array('Super Admin', $request->input('roles', []), true) && ! $request->user()->isSuperAdmin()) {
            abort(403, 'Only a Super Admin can grant the Super Admin role.');
        }
    }
}
