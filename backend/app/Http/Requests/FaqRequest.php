<?php

namespace App\Http\Requests;

class FaqRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            ...$this->translatable('question', true, 300),
            ...$this->translatable('answer', true, 3000),
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ];
    }
}
