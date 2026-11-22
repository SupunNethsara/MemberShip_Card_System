<?php

namespace App\Http\Requests;

class HeroSlideRequest extends ApiRequest
{
    public function rules(): array
    {
        // Internal paths ("/register", "#plans") or absolute https links only.
        $link = ['nullable', 'string', 'max:255', 'regex:/^(\/|#|https:\/\/)/'];

        // Title is required when creating; quick edits (publish toggle, reorder) may omit it,
        // but if it is sent the English text must be present.
        $title = $this->route('heroSlide')
            ? [
                'title' => ['sometimes', 'array'],
                'title.en' => ['required_with:title', 'string', 'max:200'],
                'title.si' => ['nullable', 'string', 'max:200'],
                'title.ta' => ['nullable', 'string', 'max:200'],
            ]
            : $this->translatable('title', true, 200);

        return [
            ...$this->translatable('badge', false, 120),
            ...$title,
            ...$this->translatable('subtitle', false, 600),
            ...$this->translatable('cta_primary_label', false, 60),
            ...$this->translatable('cta_secondary_label', false, 60),
            'cta_primary_url' => $link,
            'cta_secondary_url' => $link,
            'background' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'remove_background' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['cta_primary_url.regex' => 'Use a site path like /register or #plans, or an https:// link.', 'cta_secondary_url.regex' => 'Use a site path like /partners, or an https:// link.'];
    }
}
