<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 64)->unique();
            $table->json('name');                 // {"en": "...", "si": "...", "ta": "..."}
            $table->json('description')->nullable();
            $table->json('features')->nullable(); // [{"en":..,"si":..,"ta":..}, ...]
            $table->decimal('price', 12, 2);
            $table->unsignedSmallInteger('duration_value');
            $table->enum('duration_unit', ['days', 'months'])->default('months');
            $table->string('color', 9)->default('#13224a');
            $table->unsignedSmallInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
            $table->index(['is_active', 'priority']);
        });

        Schema::create('memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_tier_id')->constrained()->restrictOnDelete();
            $table->enum('status', ['pending', 'active', 'expired', 'cancelled'])->default('pending');
            $table->enum('source', ['payment', 'manual', 'renewal'])->default('payment');
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->string('notes')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('memberships');
        Schema::dropIfExists('membership_tiers');
    }
};
