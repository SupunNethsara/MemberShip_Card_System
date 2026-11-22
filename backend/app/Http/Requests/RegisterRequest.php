<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:190', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^(\+?94|0)?7\d{8}$/'],
            'nic' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'preferred_locale' => ['nullable', Rule::in(config('portal.locales'))],
        ];
    }

    public function messages(): array
    {
        return ['phone.regex' => 'Enter a valid Sri Lankan mobile number, e.g. 0771234567.'];
    }
}
