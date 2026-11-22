<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->json('name');
            $table->string('icon', 48)->default('store');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('slug', 120)->unique();
            $table->json('name');
            $table->json('description')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->string('address')->nullable();
            $table->string('city', 80)->nullable();
            $table->string('google_maps_url', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->index(['is_active', 'business_category_id']);
        });

        Schema::create('partner_branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('address')->nullable();
            $table->string('city', 80)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('google_maps_url', 500)->nullable();
            $table->timestamps();
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')->constrained()->cascadeOnDelete();
            $table->json('title');
            $table->json('description')->nullable();
            $table->json('terms')->nullable();
            $table->enum('discount_type', ['percentage', 'fixed', 'freebie'])->default('percentage');
            $table->decimal('discount_value', 12, 2)->nullable();
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'partner_id']);
            $table->index(['starts_at', 'ends_at']);
        });

        Schema::create('membership_tier_offer', function (Blueprint $table) {
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_tier_id')->constrained()->cascadeOnDelete();
            $table->primary(['offer_id', 'membership_tier_id']);
            $table->index('membership_tier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_tier_offer');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('partner_branches');
        Schema::dropIfExists('partners');
        Schema::dropIfExists('business_categories');
    }
};
