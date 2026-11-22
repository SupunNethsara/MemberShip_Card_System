<?php

namespace App\Models\Concerns;

/**
 * Translatable JSON columns stored as {"en": "...", "si": "...", "ta": "..."}.
 * Models declare `protected array $translatable = [...]` and cast those columns to array.
 */
trait HasTranslations
{
    public function translate(string $field, ?string $locale = null): ?string
    {
        $value = $this->getAttribute($field);
        if (! is_array($value)) {
            return $value;
        }

        $locale ??= app()->getLocale();

        return ($value[$locale] ?? null) ?: ($value['en'] ?? null) ?: (collect($value)->filter()->first());
    }

    public function getTranslatableFields(): array
    {
        return $this->translatable ?? [];
    }

    /** Normalizes incoming payloads so every supported locale key exists. */
    public static function normalizeTranslation(mixed $value): array
    {
        $value = is_array($value) ? $value : ['en' => (string) $value];

        return collect(config('portal.locales'))
            ->mapWithKeys(fn ($l) => [$l => isset($value[$l]) ? trim((string) $value[$l]) : ''])
            ->all();
    }
}
