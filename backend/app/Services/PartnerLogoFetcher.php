<?php

namespace App\Services;

use App\Models\Partner;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Downloads a partner logo from a public image URL and stores it on the public disk,
 * so the site never hotlinks third-party images at runtime.
 */
class PartnerLogoFetcher
{
    private const MAX_BYTES = 2 * 1024 * 1024;

    private const MIME_EXT = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'];

    /** Category accent colours for generated initials logos. */
    private const CATEGORY_COLORS = [
        'hotels' => '0e7490', 'salons' => 'be123c', 'retail' => '4338ca',
        'clinics' => '047857', 'gyms' => 'b45309', 'dining' => '7c2d12',
        'grocery' => '15803d', 'fuel' => '1c2f5c',
    ];

    /** Default public logo URL: a clean initials mark from DiceBear, tinted by business category. */
    public function defaultUrl(Partner $partner): string
    {
        $color = self::CATEGORY_COLORS[$partner->category?->slug] ?? '0f172a';

        return 'https://api.dicebear.com/9.x/initials/png?'.http_build_query([
            'seed' => $partner->translate('name', 'en'),
            'size' => 256,
            'backgroundColor' => $color,
            'textColor' => 'ffffff',
            'fontWeight' => 600,
            'fontSize' => 40,
        ]);
    }

    /** Sample logo shipped with the seeders: database/seeders/assets/partners/{slug}.png */
    public function bundledPath(Partner $partner): ?string
    {
        $file = database_path("seeders/assets/partners/{$partner->slug}.png");

        return is_file($file) ? $file : null;
    }

    /** Uses the bundled sample logo when one exists for this partner. Returns the stored path, or null. */
    public function useBundled(Partner $partner): ?string
    {
        $file = $this->bundledPath($partner);
        if (! $file) {
            return null;
        }

        $path = 'partners/'.$partner->slug.'-'.Str::lower(Str::random(6)).'.png';
        Storage::disk('public')->put($path, file_get_contents($file));

        if ($partner->logo_path) {
            Storage::disk('public')->delete($partner->logo_path);
        }
        $partner->forceFill(['logo_path' => $path])->save();

        return $path;
    }

    public function fetch(Partner $partner, ?string $url = null): string
    {
        $url ??= $this->defaultUrl($partner);

        if (! preg_match('#^https://#i', $url)) {
            throw new RuntimeException('Only https:// image URLs are allowed.');
        }

        $response = Http::timeout(15)->withHeaders(['Accept' => 'image/png,image/jpeg,image/webp'])->get($url);

        $mime = strtolower(trim(explode(';', (string) $response->header('Content-Type'))[0]));
        $body = $response->body();

        if (! $response->successful() || ! isset(self::MIME_EXT[$mime])) {
            throw new RuntimeException("Not a PNG/JPEG/WebP image (HTTP {$response->status()}, {$mime}).");
        }
        if (strlen($body) > self::MAX_BYTES || @getimagesizefromstring($body) === false) {
            throw new RuntimeException('Image is too large or unreadable.');
        }

        $path = 'partners/'.$partner->slug.'-'.Str::lower(Str::random(6)).'.'.self::MIME_EXT[$mime];
        Storage::disk('public')->put($path, $body);

        if ($partner->logo_path && $partner->logo_path !== $path) {
            Storage::disk('public')->delete($partner->logo_path);
        }
        $partner->forceFill(['logo_path' => $path])->save();

        return $path;
    }
}
