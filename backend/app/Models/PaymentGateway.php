<?php

namespace App\Models;

use App\Models\Concerns\HasEncryptedCredentials;
use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PaymentGateway extends Model
{
    use HasEncryptedCredentials, HasTranslations;

    protected array $translatable = ['display_name'];

    protected $fillable = [
        'driver', 'name', 'display_name', 'mode', 'is_active', 'is_default', 'sort_order', 'settings', 'webhook_key',
    ];

    protected $hidden = ['credentials'];

    protected function casts(): array
    {
        return [
            'display_name' => 'array',
            'settings' => 'array',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $g) {
            $g->webhook_key ??= Str::lower(Str::random(32));
        });
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function isSandbox(): bool
    {
        return $this->mode === 'sandbox';
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }

    public function webhookUrl(): string
    {
        return rtrim(config('app.url'), '/')."/api/webhooks/payments/{$this->webhook_key}";
    }

    public function returnUrl(): string
    {
        return rtrim(config('app.url'), '/')."/api/payments/return/{$this->webhook_key}";
    }
}
