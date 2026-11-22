<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateProfileRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^(\+?94|0)?7\d{8}$/'],
            'preferred_locale' => ['sometimes', Rule::in(config('portal.locales'))],
            'current_password' => ['required_with:password', 'current_password:sanctum'],
            'password' => ['nullable', 'confirmed', Password::min(8)->letters()->numbers()],
        ];
    }
}
