<?php

use App\Models\CmsContent;
use App\Models\HeroSlide;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Storage;

/**
 * The gold-card banner is now built into the site as hero slide 1 (frontend HeroSlider BUILT_IN_SLIDE),
 * so it shows even when the API is unreachable. Its database copy would appear twice — remove it.
 * Only the seeded banner is matched (by its fixed path); slides uploaded in CMS › Hero slides stay,
 * and now show from slide 2 onwards. The old "Homepage hero" text blocks in CMS › Page content fed the
 * same slide and no longer appear anywhere, so they are removed too.
 */
return new class extends Migration
{
    private const BANNER = 'hero/hero-gold-card.jpg';

    public function up(): void
    {
        if (HeroSlide::query()->where('background_path', self::BANNER)->delete()) {
            Storage::disk('public')->delete(self::BANNER);
        }

        CmsContent::query()->where('group', 'hero')->delete();
    }

    public function down(): void
    {
        // Slide 1 lives in the frontend now; nothing to restore.
    }
};
