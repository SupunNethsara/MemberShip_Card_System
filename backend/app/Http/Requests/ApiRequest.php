<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Base request. Authorization is enforced by route permission middleware and policies,
 * so requests only validate. Provides helpers for localized {en,si,ta} fields.
 */
abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Rules for a translatable field: English required (or nullable), Sinhala/Tamil optional. */
    protected function translatable(string $field, bool $required = true, int $max = 255): array
    {
        return [
            $field => [$required ? 'required' : 'nullable', 'array'],
            "{$field}.en" => [$required ? 'required' : 'nullable', 'string', "max:{$max}"],
            "{$field}.si" => ['nullable', 'string', "max:{$max}"],
            "{$field}.ta" => ['nullable', 'string', "max:{$max}"],
        ];
    }

    public function attributes(): array
    {
        return collect(['name', 'title', 'description', 'question', 'answer', 'body', 'terms', 'display_name', 'badge', 'subtitle', 'cta_primary_label', 'cta_secondary_label'])
            ->flatMap(fn ($f) => [
                "{$f}.en" => "{$f} (English)",
                "{$f}.si" => "{$f} (Sinhala)",
                "{$f}.ta" => "{$f} (Tamil)",
            ])->all();
    }
}
