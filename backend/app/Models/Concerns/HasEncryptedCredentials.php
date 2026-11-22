<?php

namespace App\Models\Concerns;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

/**
 * Stores a JSON credential map in the `credentials` column, encrypted with Crypt::encryptString().
 * Secrets never leave the model in plain text except through credentials()/credential().
 */
trait HasEncryptedCredentials
{
    public function credentials(): array
    {
        if (empty($this->attributes['credentials'])) {
            return [];
        }

        try {
            return json_decode(Crypt::decryptString($this->attributes['credentials']), true) ?: [];
        } catch (DecryptException) {
            return [];
        }
    }

    public function credential(string $key, mixed $default = null): mixed
    {
        return $this->credentials()[$key] ?? $default;
    }

    /**
     * Merges new values over existing ones. Empty strings or masked values (containing •)
     * keep the stored secret, so the admin UI can resubmit masked fields untouched.
     */
    public function fillCredentials(array $incoming): static
    {
        $current = $this->credentials();

        foreach ($incoming as $key => $value) {
            if ($value === null || $value === '' || (is_string($value) && str_contains($value, '•'))) {
                continue;
            }
            $current[$key] = $value;
        }

        $this->attributes['credentials'] = Crypt::encryptString(json_encode($current));

        return $this;
    }

    /** Masks every credential: ••••••••••••1234 */
    public function maskedCredentials(): array
    {
        return collect($this->credentials())
            ->map(fn ($v) => static::mask((string) $v))
            ->all();
    }

    public static function mask(string $value): string
    {
        if ($value === '') {
            return '';
        }
        $tail = mb_strlen($value) > 8 ? mb_substr($value, -4) : '';

        return str_repeat('•', 12).$tail;
    }
}
