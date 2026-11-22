<?php

namespace App\Models;

use App\Models\Concerns\HasTranslations;
use Illuminate\Database\Eloquent\Model;

class SmsTemplate extends Model
{
    use HasTranslations;

    public const EVENTS = [
        'registration_welcome' => 'Registration Welcome',
        'payment_receipt' => 'Payment Receipt',
        'membership_activated' => 'Membership Activated',
        'expiry_reminder' => 'Expiry Reminder (7 Days)',
        'membership_renewed' => 'Membership Renewed',
        'otp' => 'One-Time Password',
        'password_reset_otp' => 'Password Reset OTP',
    ];

    public const VARIABLES = ['{member_name}', '{member_id}', '{tier_name}', '{expiry_date}', '{otp_code}', '{amount}', '{invoice_no}', '{site_name}'];

    protected array $translatable = ['body'];

    protected $fillable = ['event', 'name', 'body', 'variables', 'is_active'];

    protected function casts(): array
    {
        return ['body' => 'array', 'variables' => 'array', 'is_active' => 'boolean'];
    }

    public function render(string $locale, array $vars): string
    {
        $text = $this->translate('body', $locale) ?? '';

        return strtr($text, collect($vars)->mapWithKeys(fn ($v, $k) => ['{'.trim($k, '{}').'}' => (string) $v])->all());
    }
}
