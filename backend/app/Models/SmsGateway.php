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

    public function logs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SmsLog::class);
    }

    public function computeUsage(): array
    {
        $settings = $this->settings ?? [];
        $rawCapacity = $settings['quota_capacity'] ?? null;
        $capacity = (is_numeric($rawCapacity) && (int) $rawCapacity > 0) ? (int) $rawCapacity : null;

        $validFrom = !empty($settings['valid_from']) ? \Carbon\Carbon::parse($settings['valid_from'])->startOfDay() : null;
        $validUntil = !empty($settings['valid_until']) ? \Carbon\Carbon::parse($settings['valid_until'])->endOfDay() : null;
        $validityMonths = isset($settings['validity_months']) && is_numeric($settings['validity_months']) ? (int) $settings['validity_months'] : null;
        $alertThreshold = isset($settings['alert_threshold']) && is_numeric($settings['alert_threshold']) ? (int) $settings['alert_threshold'] : 100;
        $costPerSms = isset($settings['cost_per_sms']) && is_numeric($settings['cost_per_sms']) ? (float) $settings['cost_per_sms'] : null;

        $query = $this->logs()->where('status', 'sent');
        if ($validFrom) {
            $query->where('created_at', '>=', $validFrom);
        }

        $totalSent = (clone $query)->count();
        $totalSegments = (int) ((clone $query)->sum('segments') ?: $totalSent);

        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $sentToday = $this->logs()->where('status', 'sent')->where('created_at', '>=', $todayStart)->count();
        $sentThisMonth = $this->logs()->where('status', 'sent')->where('created_at', '>=', $monthStart)->count();
        $failedTotal = $this->logs()->where('status', 'failed')->count();

        $remainingCapacity = ($capacity !== null) ? max(0, $capacity - $totalSent) : null;
        $usagePercentage = ($capacity !== null && $capacity > 0) ? min(100, round(($totalSent / $capacity) * 100, 1)) : null;

        $now = now();
        $daysRemaining = $validUntil ? (int) ceil($now->diffInDays($validUntil, false)) : null;
        $isExpired = $validUntil ? $now->gt($validUntil) : false;
        $isExpiringSoon = ($validUntil && ! $isExpired && $daysRemaining <= 7);
        $isLowBalance = ($capacity !== null && $remainingCapacity !== null && $remainingCapacity <= $alertThreshold);

        return [
            'has_quota' => $capacity !== null,
            'quota_capacity' => $capacity,
            'total_sent' => $totalSent,
            'total_segments' => $totalSegments,
            'remaining_capacity' => $remainingCapacity,
            'usage_percentage' => $usagePercentage,
            'sent_today' => $sentToday,
            'sent_this_month' => $sentThisMonth,
            'failed_total' => $failedTotal,
            'valid_from' => $validFrom?->toDateString(),
            'valid_until' => $validUntil?->toDateString(),
            'validity_months' => $validityMonths,
            'days_remaining' => $daysRemaining,
            'is_expired' => $isExpired,
            'is_expiring_soon' => $isExpiringSoon,
            'is_low_balance' => $isLowBalance,
            'alert_threshold' => $alertThreshold,
            'cost_per_sms' => $costPerSms,
        ];
    }
}
