<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class RoleRequest extends ApiRequest
{
    public function rules(): array
    {
        $id = $this->route('role')?->id;

        return [
            'name' => [$this->isMethod('post') ? 'required' : 'sometimes', 'string', 'max:60', Rule::unique('roles', 'name')->where('guard_name', 'web')->ignore($id)],
            'description' => ['nullable', 'string', 'max:255'],
            'copy_from' => ['nullable', 'integer', 'exists:roles,id'],
        ];
    }
}
