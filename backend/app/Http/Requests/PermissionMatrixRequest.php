<?php

namespace App\Http\Requests;

class PermissionMatrixRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'matrix' => ['required', 'array'],
            'matrix.*' => ['array'],
            'matrix.*.*' => ['string', 'exists:permissions,name'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $ids = array_keys($this->input('matrix', []));
            $known = \Spatie\Permission\Models\Role::query()->whereIn('id', $ids)->count();
            if ($known !== count($ids)) {
                $v->errors()->add('matrix', 'The matrix references unknown roles.');
            }
        });
    }
}
