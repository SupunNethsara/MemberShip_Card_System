<?php

namespace App\Http\Requests;

class SlipUploadRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'slip' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}
