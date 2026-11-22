<?php

namespace App\Services;

use App\Models\BusinessCategory;
use App\Models\Concerns\HasTranslations;
use App\Models\MembershipTier;
use App\Models\Offer;
use App\Models\Partner;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/** Business logic for tiers, categories, partners (with branches & logos) and offers (with tier mapping). */
class CatalogService
{
    public function __construct(private readonly AuditLogger $audit) {}

    private function tr(mixed $v): array
    {
        return HasTranslations::normalizeTranslation($v);
    }

    private function uniqueSlug(string $modelClass, string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base) ?: Str::lower(Str::random(6));
        $candidate = $slug;
        $i = 2;
        while ($modelClass::query()->where('slug', $candidate)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $candidate = "{$slug}-{$i}";
            $i++;
        }

        return $candidate;
    }

    // ── Tiers ──────────────────────────────────────────────────────────

    public function saveTier(?MembershipTier $tier, array $data): MembershipTier
    {
        $tier ??= new MembershipTier;
        $payload = [
            'name' => $this->tr($data['name']),
            'description' => $this->tr($data['description'] ?? []),
            'features' => collect($data['features'] ?? [])->map(fn ($f) => $this->tr($f))->filter(fn ($f) => $f['en'] !== '')->values()->all(),
            'price' => $data['price'],
            'duration_value' => $data['duration_value'],
            'duration_unit' => $data['duration_unit'],
            'color' => $data['color'],
            'priority' => $data['priority'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
            'is_featured' => $data['is_featured'] ?? false,
        ];
        $payload['slug'] = $data['slug'] ?? $tier->slug ?? $this->uniqueSlug(MembershipTier::class, $payload['name']['en']);

        $creating = ! $tier->exists;
        $tier->fill($payload)->save();
        $this->audit->log($creating ? 'tier.created' : 'tier.updated', ($creating ? 'Created' : 'Updated')." tier {$payload['name']['en']}", $tier);

        return $tier;
    }

    public function deleteTier(MembershipTier $tier): void
    {
        if ($tier->memberships()->exists()) {
            throw ValidationException::withMessages(['tier' => 'This tier has memberships. Deactivate it instead of deleting.']);
        }
        $this->audit->log('tier.deleted', 'Deleted tier '.$tier->translate('name', 'en'), $tier);
        $tier->delete();
    }

    // ── Categories ─────────────────────────────────────────────────────

    public function saveCategory(?BusinessCategory $category, array $data): BusinessCategory
    {
        $category ??= new BusinessCategory;
        $name = $this->tr($data['name']);
        $category->fill([
            'name' => $name,
            'icon' => $data['icon'] ?? 'store',
            'sort_order' => $data['sort_order'] ?? 0,
            'slug' => $category->slug ?? $this->uniqueSlug(BusinessCategory::class, $name['en']),
        ])->save();

        return $category;
    }

    // ── Partners ───────────────────────────────────────────────────────

    public function savePartner(?Partner $partner, array $data, ?UploadedFile $logo = null): Partner
    {
        return DB::transaction(function () use ($partner, $data, $logo) {
            $partner ??= new Partner;
            $creating = ! $partner->exists;
            $name = $this->tr($data['name']);

            $partner->fill([
                'business_category_id' => $data['business_category_id'] ?? null,
                'name' => $name,
                'description' => $this->tr($data['description'] ?? []),
                'contact_person' => $data['contact_person'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'website' => $data['website'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'google_maps_url' => $data['google_maps_url'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'is_featured' => $data['is_featured'] ?? false,
                'slug' => $partner->slug ?? $this->uniqueSlug(Partner::class, $name['en']),
            ]);

            if ($logo) {
                $old = $partner->logo_path;
                $partner->logo_path = $logo->store('partners', 'public');
                if ($old) {
                    DB::afterCommit(fn () => Storage::disk('public')->delete($old));
                }
            } elseif (! empty($data['remove_logo']) && $partner->logo_path) {
                $old = $partner->logo_path;
                $partner->logo_path = null;
                DB::afterCommit(fn () => Storage::disk('public')->delete($old));
            }

            $partner->save();

            if (array_key_exists('branches', $data)) {
                $keep = [];
                foreach ($data['branches'] ?? [] as $b) {
                    if (empty($b['name'])) {
                        continue;
                    }
                    $branch = $partner->branches()->updateOrCreate(
                        ['id' => $b['id'] ?? null],
                        collect($b)->only(['name', 'address', 'city', 'phone', 'google_maps_url'])->all()
                    );
                    $keep[] = $branch->id;
                }
                $partner->branches()->whereNotIn('id', $keep)->delete();
            }

            $this->audit->log($creating ? 'partner.created' : 'partner.updated', ($creating ? 'Created' : 'Updated')." partner {$name['en']}", $partner);

            return $partner->load(['category', 'branches']);
        });
    }

    public function deletePartner(Partner $partner): void
    {
        $this->audit->log('partner.deleted', 'Deleted partner '.$partner->translate('name', 'en'), $partner);
        if ($partner->logo_path) {
            Storage::disk('public')->delete($partner->logo_path);
        }
        $partner->delete();
    }

    // ── Offers ─────────────────────────────────────────────────────────

    public function saveOffer(?Offer $offer, array $data): Offer
    {
        return DB::transaction(function () use ($offer, $data) {
            $offer ??= new Offer;
            $creating = ! $offer->exists;
            $title = $this->tr($data['title']);

            $offer->fill([
                'partner_id' => $data['partner_id'],
                'title' => $title,
                'description' => $this->tr($data['description'] ?? []),
                'terms' => $this->tr($data['terms'] ?? []),
                'discount_type' => $data['discount_type'],
                'discount_value' => $data['discount_value'] ?? null,
                'starts_at' => $data['starts_at'] ?? null,
                'ends_at' => $data['ends_at'] ?? null,
                'is_active' => $data['is_active'] ?? true,
            ])->save();

            $offer->tiers()->sync($data['tier_ids'] ?? []);

            $this->audit->log($creating ? 'offer.created' : 'offer.updated', ($creating ? 'Created' : 'Updated')." offer {$title['en']}", $offer, ['tier_ids' => $data['tier_ids'] ?? []]);

            return $offer->load(['partner', 'tiers']);
        });
    }
}
