<?php

namespace App\Http\Requests;

class CategoryRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            ...$this->translatable('name', true, 80),
            'icon' => ['nullable', 'string', 'max:48'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
