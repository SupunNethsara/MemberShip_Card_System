<?php

namespace Database\Seeders;

use App\Support\PermissionRegistry;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionRegistry::flat() as $p) {
            Permission::query()->updateOrCreate(
                ['name' => $p['name'], 'guard_name' => 'web'],
                ['group' => $p['group'], 'label' => $p['label'], 'sort_order' => $p['sort_order']]
            );
        }

        foreach (PermissionRegistry::ROLES as $name => $def) {
            $role = Role::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['description' => $def['description'], 'is_system' => true, 'is_staff' => $def['staff']]
            );
            $role->syncPermissions($def['permissions'] === '*' ? PermissionRegistry::all() : $def['permissions']);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
