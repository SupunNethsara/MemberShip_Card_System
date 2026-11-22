<?php

namespace App\Http\Requests;

class TestSmsRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'phone' => ['required', 'string', 'min:9', 'max:20'],
            'message' => ['nullable', 'string', 'max:600'],
        ];
    }
}
