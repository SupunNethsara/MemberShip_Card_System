<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_gateways', function (Blueprint $table) {
            $table->id();
            $table->string('driver', 32)->index(); // notifylk | dialog | mobitel | hutch | twilio | custom_http | log
            $table->string('name');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_fallback')->default(false);
            $table->string('sender_id', 20)->nullable();
            $table->text('credentials')->nullable(); // encrypted json
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        Schema::create('sms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('event', 48)->unique();
            $table->string('name');
            $table->json('body');
            $table->json('variables')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('sms_gateway_id')->nullable()->constrained()->nullOnDelete();
            $table->string('recipient', 20)->index();
            $table->string('event', 48)->index();
            $table->char('locale', 2)->default('en');
            $table->text('message');
            $table->enum('status', ['sent', 'failed'])->index();
            $table->unsignedSmallInteger('http_status')->nullable();
            $table->text('provider_response')->nullable();
            $table->unsignedSmallInteger('segments')->default(1);
            $table->timestamps();
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
        Schema::dropIfExists('sms_templates');
        Schema::dropIfExists('sms_gateways');
    }
};
