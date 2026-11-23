<?php

use App\Models\HeroSlide;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

/**
 * Puts the client's gold-card family banner on the first homepage hero slide.
 * Only touches a slide still using the stock seeded artwork, so a background an admin
 * uploaded through CMS › Hero slides is never overwritten.
 */
return new class extends Migration
{
    private const STOCK = 'hero/hero-bg.jpg';

    private const BANNER = 'hero/hero-gold-card.jpg';

    public function up(): void
    {
        $first = HeroSlide::query()->orderBy('sort_order')->orderBy('id')->first();
        if (! $first || $first->background_path !== self::STOCK) {
            return;
        }

        Storage::disk('public')->put(self::BANNER, file_get_contents(database_path('seeders/assets/hero-gold-card.jpg')));
        $first->update(['background_path' => self::BANNER]);
    }

    public function down(): void
    {
        HeroSlide::query()->where('background_path', self::BANNER)->update(['background_path' => self::STOCK]);
    }
};
