<?php

use App\Models\HeroSlide;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

/**
 * Removes hero slides that still show the old stock artwork (hero/hero-bg.jpg).
 * Slides with a background an admin uploaded are never touched.
 */
return new class extends Migration
{
    private const STOCK = 'hero/hero-bg.jpg';

    public function up(): void
    {
        if (HeroSlide::query()->where('background_path', self::STOCK)->delete()) {
            Storage::disk('public')->delete(self::STOCK);
        }
    }

    public function down(): void
    {
        // The stock slide was retired on purpose; nothing to restore.
    }
};
