<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PaymentGatewayRequest;
use App\Http\Requests\SmsGatewayRequest;
use App\Http\Requests\TestSmsRequest;
use App\Http\Resources\PaymentGatewayResource;
use App\Http\Resources\SmsGatewayResource;
use App\Http\Resources\SmsLogResource;
use App\Models\PaymentGateway;
use App\Models\SmsGateway;
use App\Services\AuditLogger;
use App\Services\GatewayConfigService;
use App\Services\Payments\PaymentGatewayFactory;
use App\Services\Sms\SmsGatewayFactory;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

/** Settings > Payment Gateways and Settings > SMS Gateways. */
class GatewayController extends Controller
{
    public function __construct(private readonly GatewayConfigService $config) {}

    // ── Payment ────────────────────────────────────────────────────────

    public function paymentIndex(): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', PaymentGateway::class);

        return PaymentGatewayResource::collection(
            PaymentGateway::query()->withCount('transactions')->orderBy('sort_order')->get()
        )->additional(['drivers' => PaymentGatewayFactory::definitions()]);
    }

    public function paymentStore(PaymentGatewayRequest $request): PaymentGatewayResource
    {
        Gate::authorize('create', PaymentGateway::class);

        return new PaymentGatewayResource($this->config->savePayment(null, $request->validated()));
    }

    public function paymentUpdate(PaymentGatewayRequest $request, PaymentGateway $paymentGateway): PaymentGatewayResource
    {
        Gate::authorize('update', $paymentGateway);

        return new PaymentGatewayResource($this->config->savePayment($paymentGateway, $request->validated()));
    }

    public function paymentDestroy(PaymentGateway $paymentGateway): JsonResponse
    {
        Gate::authorize('delete', $paymentGateway);
        $this->config->delete($paymentGateway, 'payment');

        return response()->json(['message' => 'Gateway deleted']);
    }

    // ── SMS ────────────────────────────────────────────────────────────

    public function smsIndex(SmsService $sms): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', SmsGateway::class);

        return SmsGatewayResource::collection(SmsGateway::query()->orderByDesc('is_primary')->orderByDesc('is_fallback')->orderBy('id')->get())
            ->additional(['drivers' => SmsGatewayFactory::definitions(), 'enabled' => $sms->enabled()]);
    }

    public function smsStore(SmsGatewayRequest $request): SmsGatewayResource
    {
        Gate::authorize('create', SmsGateway::class);

        return new SmsGatewayResource($this->config->saveSms(null, $request->validated()));
    }

    public function smsUpdate(SmsGatewayRequest $request, SmsGateway $smsGateway): SmsGatewayResource
    {
        Gate::authorize('update', $smsGateway);

        return new SmsGatewayResource($this->config->saveSms($smsGateway, $request->validated()));
    }

    public function smsDestroy(SmsGateway $smsGateway): JsonResponse
    {
        Gate::authorize('delete', $smsGateway);
        $this->config->delete($smsGateway, 'sms');

        return response()->json(['message' => 'Gateway deleted']);
    }

    /** Global on/off switch for automated SMS (test messages always send). */
    public function smsService(\Illuminate\Http\Request $request, AuditLogger $audit): JsonResponse
    {
        $data = $request->validate(['enabled' => ['required', 'boolean']]);
        \App\Models\Setting::put('sms.enabled', (bool) $data['enabled']);
        $audit->log('sms.service', $data['enabled'] ? 'Enabled automated SMS' : 'Paused automated SMS');

        return response()->json(['enabled' => (bool) $data['enabled']]);
    }

    /** "Send Test SMS" widget — always targets the chosen gateway directly and returns the raw provider response. */
    public function smsTest(TestSmsRequest $request, SmsGateway $smsGateway, SmsService $sms, AuditLogger $audit): JsonResponse
    {
        Gate::authorize('update', $smsGateway);

        $started = microtime(true);
        $message = $request->input('message') ?: 'Test message from '.config('app.name').' via '.$smsGateway->name.' at '.now()->format('H:i:s');
        $log = $sms->send($request->input('phone'), $message, 'test', $request->user(), $smsGateway);

        $audit->log('gateway.sms.test', "Sent test SMS via {$smsGateway->name}", $smsGateway, ['status' => $log?->status]);

        return response()->json([
            'success' => $log?->status === 'sent',
            'duration_ms' => (int) round((microtime(true) - $started) * 1000),
            'log' => $log ? new SmsLogResource($log->load('gateway')) : null,
            'message' => $log ? null : 'Invalid phone number.',
        ], $log ? 200 : 422);
    }
}
