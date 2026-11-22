<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('driver', 32)->index();    // payhere | stripe | webxpay | manual
            $table->string('name');
            $table->json('display_name')->nullable(); // localized label at checkout
            $table->enum('mode', ['sandbox', 'live'])->default('sandbox');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_default')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->text('credentials')->nullable();  // Crypt::encryptString(json)
            $table->json('settings')->nullable();     // non-secret options
            $table->string('webhook_key', 40)->unique();
            $table->timestamps();
            $table->index(['is_active', 'sort_order']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('number', 40)->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('membership_tier_id')->constrained()->restrictOnDelete();
            $table->foreignId('membership_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('payment_gateway_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['new', 'renewal', 'upgrade'])->default('new');
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3)->default('LKR');
            $table->enum('status', ['pending', 'awaiting_approval', 'paid', 'failed', 'cancelled', 'refunded'])->default('pending');
            $table->string('slip_path')->nullable();
            $table->string('notes')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
            $table->index(['status', 'paid_at']);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_gateway_id')->nullable()->constrained()->nullOnDelete();
            $table->string('driver', 32);
            $table->enum('direction', ['initiate', 'webhook', 'return', 'manual'])->default('initiate');
            $table->string('reference')->nullable()->index();
            $table->enum('status', ['initiated', 'success', 'failed', 'invalid_signature', 'pending'])->default('initiated');
            $table->decimal('amount', 12, 2)->nullable();
            $table->json('payload')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('message')->nullable();
            $table->timestamps();
            $table->index(['invoice_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('payment_gateways');
    }
};
