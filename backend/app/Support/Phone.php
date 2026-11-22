<?php

namespace App\Support;

final class Phone
{
    /** Normalizes Sri Lankan numbers to E.164 without '+': 0771234567 -> 94771234567. Other numbers keep their digits. */
    public static function normalize(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }
        $digits = preg_replace('/\D+/', '', $phone);

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '94'.substr($digits, 1);
        }
        if (strlen($digits) === 9 && str_starts_with($digits, '7')) {
            return '94'.$digits;
        }

        return $digits ?: null;
    }

    public static function local(string $normalized): string
    {
        return str_starts_with($normalized, '94') ? '0'.substr($normalized, 2) : $normalized;
    }
}
