<?php

namespace App\Models;

use App\Models\Concerns\HasEncryptedCredentials;
use Illuminate\Database\Eloquent\Model;

class SmsGateway extends Model
{
    use HasEncryptedCredentials;

    protected $fillable = ['driver', 'name', 'is_active', 'is_primary', 'is_fallback', 'sender_id', 'settings'];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'is_active' => 'boolean',
            'is_primary' => 'boolean',
            'is_fallback' => 'boolean',
        ];
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }
}
