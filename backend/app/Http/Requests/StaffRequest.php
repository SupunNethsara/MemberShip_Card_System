<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StaffRequest extends ApiRequest
{
    public function rules(): array
    {
        $id = $this->route('staff')?->id;
        $creating = $this->isMethod('post');

        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'status' => ['nullable', Rule::in(['active', 'suspended'])],
            'suspension_reason' => ['nullable', 'string', 'max:1000'],
            'password' => [$creating ? 'required' : 'nullable', Password::min(8)->letters()->numbers()],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ];
    }
}
