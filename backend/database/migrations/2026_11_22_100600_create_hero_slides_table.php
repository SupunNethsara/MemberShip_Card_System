<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->json('badge')->nullable();               // {"en","si","ta"}
            $table->json('title');                           // *word* = gold highlight
            $table->json('subtitle')->nullable();
            $table->json('cta_primary_label')->nullable();
            $table->string('cta_primary_url', 255)->nullable();
            $table->json('cta_secondary_label')->nullable();
            $table->string('cta_secondary_url', 255)->nullable();
            $table->string('background_path')->nullable();   // null → frontend default artwork
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
