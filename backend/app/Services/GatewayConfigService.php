<?php

namespace App\Services;

use App\Models\PaymentGateway;
use App\Models\SmsGateway;
use App\Services\Payments\PaymentGatewayFactory;
use App\Services\Sms\SmsGatewayFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Persists admin gateway configuration with encrypted credentials and full audit trail. */
class GatewayConfigService
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function savePayment(?PaymentGateway $gateway, array $data): PaymentGateway
    {
        $this->assertKnownFields(PaymentGatewayFactory::DRIVERS, $data['driver'] ?? $gateway?->driver, $data);

        return DB::transaction(function () use ($gateway, $data) {
            $gateway ??= new PaymentGateway(['driver' => $data['driver']]);
            $creating = ! $gateway->exists;

            $gateway->fill(collect($data)->only(['name', 'display_name', 'mode', 'is_active', 'is_default', 'sort_order', 'settings'])->all());

            $changedKeys = $this->applyCredentials($gateway, $data['credentials'] ?? []);
            $dirty = array_keys($gateway->getDirty());
            $gateway->save();

            if ($gateway->is_default) {
                PaymentGateway::query()->whereKeyNot($gateway->id)->update(['is_default' => false]);
            }

            $this->auditChange('payment', $gateway, $creating, $dirty, $changedKeys);

            return $gateway->refresh();
        });
    }

    public function saveSms(?SmsGateway $gateway, array $data): SmsGateway
    {
        $this->assertKnownFields(SmsGatewayFactory::DRIVERS, $data['driver'] ?? $gateway?->driver, $data);

        return DB::transaction(function () use ($gateway, $data) {
            $gateway ??= new SmsGateway(['driver' => $data['driver']]);
            $creating = ! $gateway->exists;

            $gateway->fill(collect($data)->only(['name', 'is_active', 'is_primary', 'is_fallback', 'sender_id', 'settings'])->all());
            if ($gateway->is_primary) {
                $gateway->is_fallback = false;
            }

            $changedKeys = $this->applyCredentials($gateway, $data['credentials'] ?? []);
            $dirty = array_keys($gateway->getDirty());
            $gateway->save();

            if ($gateway->is_primary) {
                SmsGateway::query()->whereKeyNot($gateway->id)->update(['is_primary' => false]);
            }
            if ($gateway->is_fallback) {
                SmsGateway::query()->whereKeyNot($gateway->id)->update(['is_fallback' => false]);
            }

            $this->auditChange('sms', $gateway, $creating, $dirty, $changedKeys);

            return $gateway->refresh();
        });
    }

    public function delete(Model $gateway, string $kind): void
    {
        $this->audit->log("gateway.{$kind}.deleted", "Deleted {$kind} gateway {$gateway->name}", $gateway);
        $gateway->delete();
    }

    /** @return string[] credential keys that received a new value */
    private function applyCredentials(PaymentGateway|SmsGateway $gateway, array $incoming): array
    {
        $changed = collect($incoming)
            ->filter(fn ($v) => $v !== null && $v !== '' && ! (is_string($v) && str_contains($v, '•')))
            ->keys()->all();

        if ($changed || ! $gateway->exists) {
            $gateway->fillCredentials($incoming);
        }

        return $changed;
    }

    private function auditChange(string $kind, Model $gateway, bool $creating, array $dirty, array $credentialKeys): void
    {
        $dirty = array_values(array_diff($dirty, ['credentials', 'updated_at', 'created_at']));

        if ($creating) {
            $this->audit->log("gateway.{$kind}.created", "Created {$kind} gateway {$gateway->name}", $gateway, ['driver' => $gateway->driver]);
        } elseif ($dirty) {
            $this->audit->log("gateway.{$kind}.updated", "Updated {$kind} gateway {$gateway->name}", $gateway, ['fields' => $dirty]);
        }

        if ($credentialKeys && ! $creating) {
            // Key names only — secret values are never written to the audit log.
            $this->audit->log("gateway.{$kind}.credentials_changed", "Changed credentials on {$kind} gateway {$gateway->name}", $gateway, ['keys' => $credentialKeys]);
        }
    }

    private function assertKnownFields(array $drivers, ?string $driver, array $data): void
    {
        if (! $driver || ! isset($drivers[$driver])) {
            throw ValidationException::withMessages(['driver' => 'Unsupported driver.']);
        }
        $allowed = collect($drivers[$driver]::definition()['credentials'])->pluck('key')->all();
        $unknown = array_diff(array_keys($data['credentials'] ?? []), $allowed);
        if ($unknown) {
            throw ValidationException::withMessages(['credentials' => 'Unknown credential fields: '.implode(', ', $unknown)]);
        }
    }
}
