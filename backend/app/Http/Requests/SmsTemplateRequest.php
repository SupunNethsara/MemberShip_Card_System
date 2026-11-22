<?php

namespace App\Http\Requests;

class SmsTemplateRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            ...$this->translatable('body', true, 600),
            'is_active' => ['boolean'],
        ];
    }
}
