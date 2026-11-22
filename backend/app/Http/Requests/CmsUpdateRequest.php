<?php

namespace App\Http\Requests;

class CmsUpdateRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'contents' => ['sometimes', 'array'],
            'contents.*.key' => ['required', 'string', 'exists:cms_contents,key'],
            'contents.*.value' => ['required', 'array'],
            'contents.*.value.en' => ['nullable', 'string', 'max:20000'],
            'contents.*.value.si' => ['nullable', 'string', 'max:20000'],
            'contents.*.value.ta' => ['nullable', 'string', 'max:20000'],
            'settings' => ['nullable', 'array'],
            'settings.site_name' => ['nullable', 'string', 'max:80'],
            'settings.contact_email' => ['nullable', 'email', 'max:190'],
            'settings.contact_phone' => ['nullable', 'string', 'max:40'],
            'settings.sms_enabled' => ['nullable', 'boolean'],

            // Footer: social media (each optional; https only) + WhatsApp number
            'settings.social' => ['nullable', 'array'],
            'settings.social.facebook' => ['nullable', 'url:https', 'max:255'],
            'settings.social.instagram' => ['nullable', 'url:https', 'max:255'],
            'settings.social.youtube' => ['nullable', 'url:https', 'max:255'],
            'settings.social.tiktok' => ['nullable', 'url:https', 'max:255'],
            'settings.social.linkedin' => ['nullable', 'url:https', 'max:255'],
            'settings.social.x' => ['nullable', 'url:https', 'max:255'],
            'settings.social.whatsapp' => ['nullable', 'string', 'regex:/^\+?[0-9 ]{9,16}$/'],

            // Footer: additional emails / phone numbers with a label in EN / SI / TA
            'settings.contact_extra' => ['nullable', 'array', 'max:12'],
            'settings.contact_extra.*.type' => ['required', 'in:email,phone'],
            'settings.contact_extra.*.value' => ['required', 'string', 'max:120'],
            'settings.contact_extra.*.label' => ['nullable', 'array'],
            'settings.contact_extra.*.label.en' => ['nullable', 'string', 'max:60'],
            'settings.contact_extra.*.label.si' => ['nullable', 'string', 'max:60'],
            'settings.contact_extra.*.label.ta' => ['nullable', 'string', 'max:60'],
        ];
    }

    /** Each extra contact must be a valid email or phone according to its type. */
    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            foreach ((array) $this->input('settings.contact_extra', []) as $i => $row) {
                $value = trim((string) ($row['value'] ?? ''));
                if (($row['type'] ?? '') === 'email' && ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $v->errors()->add("settings.contact_extra.$i.value", 'Enter a valid email address.');
                }
                if (($row['type'] ?? '') === 'phone' && ! preg_match('/^\+?[0-9 ()-]{7,20}$/', $value)) {
                    $v->errors()->add("settings.contact_extra.$i.value", 'Enter a valid phone number.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'settings.social.*.url' => 'Use a full https:// link, e.g. https://facebook.com/yourpage',
            'settings.social.whatsapp.regex' => 'Enter the WhatsApp number with country code, e.g. +94 77 123 4567',
        ];
    }
}
