<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,   // permissions, system roles, default grants
            ContentSeeder::class,          // CMS blocks, FAQs, settings, SMS templates
            HeroSlideSeeder::class,        // homepage hero slides (multilingual)
            CatalogSeeder::class,          // tiers, categories, partners, branches, offers
            GatewaySeeder::class,          // payment & SMS gateways (sandbox / dev)
            DemoUserSeeder::class,         // staff accounts, members, memberships, invoices, logs
        ]);
    }
}
