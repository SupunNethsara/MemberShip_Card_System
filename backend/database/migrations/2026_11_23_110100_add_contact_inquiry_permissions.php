<?php

use App\Support\PermissionRegistry;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Adds the Contact Inquiries permissions to an existing install without resetting
 * any role's customised permission matrix (re-running the seeder would sync and overwrite it).
 */
return new class extends Migration
{
    private const PERMS = ['inquiries.view', 'inquiries.manage'];

    private const GRANTS = ['Super Admin', 'Operations Manager', 'Support Staff'];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $meta = collect(PermissionRegistry::flat())->keyBy('name');
        foreach (self::PERMS as $name) {
            Permission::query()->updateOrCreate(
                ['name' => $name, 'guard_name' => 'web'],
                ['group' => $meta[$name]['group'], 'label' => $meta[$name]['label'], 'sort_order' => $meta[$name]['sort_order']]
            );
        }

        foreach (self::GRANTS as $roleName) {
            Role::query()->where('name', $roleName)->where('guard_name', 'web')->first()?->givePermissionTo(self::PERMS);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::query()->whereIn('name', self::PERMS)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
