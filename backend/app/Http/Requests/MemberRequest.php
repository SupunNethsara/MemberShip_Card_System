<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class MemberRequest extends ApiRequest
{
    public function rules(): array
    {
        $id = $this->route('member')?->id;
        $creating = $this->isMethod('post');

        return [
            'name' => [$creating ? 'required' : 'sometimes', 'string', 'max:120'],
            'email' => [$creating ? 'required' : 'sometimes', 'email', 'max:190', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'regex:/^(\+?94|0)?7\d{8}$/'],
            'nic' => ['nullable', 'string', 'max:20'],
            'preferred_locale' => ['nullable', Rule::in(config('portal.locales'))],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'suspension_reason' => ['nullable', 'string', 'max:1000'],
            'password' => [$creating ? 'required' : 'nullable', Password::min(8)],
            'send_welcome' => ['nullable', 'boolean'],
        ];
    }
}
