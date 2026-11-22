<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CmsUpdateRequest;
use App\Http\Requests\FaqRequest;
use App\Http\Resources\CmsContentResource;
use App\Http\Resources\FaqResource;
use App\Models\CmsContent;
use App\Models\Concerns\HasTranslations;
use App\Models\Faq;
use App\Models\Setting;
use App\Repositories\FaqRepository;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CmsController extends Controller
{
    private const SETTING_MAP = [
        'site_name' => 'site.name',
        'contact_email' => 'contact.email',
        'contact_phone' => 'contact.phone',
        'sms_enabled' => 'sms.enabled',
        'social' => 'social',
        'contact_extra' => 'contact.extra',
    ];

    private const SOCIAL_KEYS = ['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x', 'whatsapp'];

    public function index(): JsonResponse
    {
        return response()->json([
            'contents' => CmsContentResource::collection(CmsContent::query()->orderBy('group')->orderBy('sort_order')->get()),
            'settings' => collect(self::SETTING_MAP)->map(fn ($key) => Setting::get($key)),
            // social / contact_extra are included above via SETTING_MAP (empty → null).
            'branding' => [
                'logo_url' => Setting::assetUrl('site.logo'),
            ],
        ]);
    }

    public function update(CmsUpdateRequest $request, AuditLogger $audit): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->input('contents', []) as $row) {
                CmsContent::query()->where('key', $row['key'])->update([
                    'value' => json_encode(HasTranslations::normalizeTranslation($row['value']), JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
            }
            foreach ($request->input('settings', []) as $field => $value) {
                if (! isset(self::SETTING_MAP[$field])) {
                    continue;
                }
                $value = match ($field) {
                    'sms_enabled' => (bool) $value,
                    // Keep only known platforms with a value.
                    'social' => collect(self::SOCIAL_KEYS)->mapWithKeys(fn ($k) => [$k => trim((string) data_get($value, $k, ''))])->filter()->all(),
                    'contact_extra' => collect($value ?? [])->map(fn ($r) => [
                        'type' => $r['type'],
                        'value' => trim($r['value']),
                        'label' => HasTranslations::normalizeTranslation($r['label'] ?? []),
                    ])->filter(fn ($r) => $r['value'] !== '')->values()->all(),
                    default => $value,
                };
                Setting::put(self::SETTING_MAP[$field], $value);
            }
        });

        $audit->log('cms.updated', 'Updated CMS content ('.count($request->input('contents', [])).' blocks)');

        return $this->index();
    }

    /** Replace the site logo (transparent PNG recommended). PNG/JPG/WebP only (no SVG — script risk). */
    public function uploadLogo(Request $request, AuditLogger $audit): JsonResponse
    {
        $request->validate([
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);
        abort_unless($request->hasFile('logo'), 422, 'Choose an image to upload.');

        foreach (['logo' => 'site.logo'] as $field => $key) {
            if ($file = $request->file($field)) {
                $old = Setting::get($key);
                Setting::put($key, $file->store('brand', 'public'));
                if ($old && str_starts_with($old, 'brand/')) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
                }
            }
        }
        $audit->log('cms.branding', 'Updated site logo');

        return $this->index();
    }

    public function faqs(Request $request, FaqRepository $repo): AnonymousResourceCollection
    {
        return FaqResource::collection($repo->paginate($request->all() + ['per_page' => 100]));
    }

    public function storeFaq(FaqRequest $request): FaqResource
    {
        Gate::authorize('create', Faq::class);

        return new FaqResource(Faq::query()->create($this->faqPayload($request)));
    }

    public function updateFaq(FaqRequest $request, Faq $faq): FaqResource
    {
        Gate::authorize('update', $faq);
        $faq->update($this->faqPayload($request));

        return new FaqResource($faq);
    }

    public function destroyFaq(Faq $faq): JsonResponse
    {
        Gate::authorize('delete', $faq);
        $faq->delete();

        return response()->json(['message' => 'FAQ deleted']);
    }

    private function faqPayload(FaqRequest $request): array
    {
        return [
            'question' => HasTranslations::normalizeTranslation($request->input('question')),
            'answer' => HasTranslations::normalizeTranslation($request->input('answer')),
            'sort_order' => $request->integer('sort_order'),
            'is_active' => $request->boolean('is_active', true),
        ];
    }
}
