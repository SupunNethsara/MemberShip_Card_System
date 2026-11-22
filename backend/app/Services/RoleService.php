<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data) {
            $role = Role::query()->create([
                'name' => $data['name'],
                'guard_name' => 'web',
                'description' => $data['description'] ?? null,
                'is_system' => false,
                'is_staff' => true,
            ]);

            if (! empty($data['copy_from'])) {
                $source = Role::query()->findOrFail($data['copy_from']);
                $role->syncPermissions($source->permissions);
            }

            $this->audit->log('role.created', "Created role {$role->name}", $role);

            return $role;
        });
    }

    public function update(Role $role, array $data): Role
    {
        if ($role->is_system && isset($data['name']) && $data['name'] !== $role->name) {
            throw ValidationException::withMessages(['name' => 'System roles cannot be renamed.']);
        }
        $role->update(array_filter(['name' => $data['name'] ?? null, 'description' => $data['description'] ?? null], fn ($v) => $v !== null));
        $this->audit->log('role.updated', "Updated role {$role->name}", $role);

        return $role;
    }

    public function delete(Role $role): void
    {
        if ($role->is_system) {
            throw ValidationException::withMessages(['role' => 'System roles cannot be deleted.']);
        }
        if (DB::table('model_has_roles')->where('role_id', $role->id)->exists()) {
            throw ValidationException::withMessages(['role' => 'Reassign the users holding this role before deleting it.']);
        }
        $this->audit->log('role.deleted', "Deleted role {$role->name}", $role);
        $role->delete();
    }

    /**
     * Bulk-saves the permission matrix.
     *
     * @param  array<int|string, string[]>  $matrix  role_id => permission names
     * @return array<string, array{added:string[], removed:string[]}>
     */
    public function syncMatrix(array $matrix): array
    {
        $valid = Permission::query()->pluck('name')->all();
        $changes = [];

        DB::transaction(function () use ($matrix, $valid, &$changes) {
            $roles = Role::query()->with('permissions')->whereIn('id', array_keys($matrix))->get();

            foreach ($roles as $role) {
                if ($role->name === 'Super Admin') {
                    continue; // Super Admin always holds every permission.
                }

                $desired = array_values(array_intersect($matrix[$role->id] ?? [], $valid));
                $current = $role->permissions->pluck('name')->all();
                $added = array_values(array_diff($desired, $current));
                $removed = array_values(array_diff($current, $desired));

                if ($added || $removed) {
                    $role->syncPermissions($desired);
                    $changes[$role->name] = compact('added', 'removed');
                }
            }

            if ($changes) {
                $this->audit->log('permissions.updated', 'Updated permission matrix for '.implode(', ', array_keys($changes)), null, $changes);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $changes;
    }
}
