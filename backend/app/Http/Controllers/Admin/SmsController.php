<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SmsTemplateRequest;
use App\Http\Resources\SmsLogResource;
use App\Http\Resources\SmsTemplateResource;
use App\Models\Concerns\HasTranslations;
use App\Models\SmsLog;
use App\Models\SmsTemplate;
use App\Repositories\SmsLogRepository;
use App\Services\AuditLogger;
use App\Services\Sms\SmsService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SmsController extends Controller
{
    public function templates(): AnonymousResourceCollection
    {
        $order = array_keys(SmsTemplate::EVENTS);

        return SmsTemplateResource::collection(
            SmsTemplate::query()->get()->sortBy(fn ($t) => array_search($t->event, $order, true))->values()
        )->additional(['variables' => SmsTemplate::VARIABLES]);
    }

    public function updateTemplate(SmsTemplateRequest $request, SmsTemplate $smsTemplate, AuditLogger $audit, SmsService $sms): SmsTemplateResource
    {
        $smsTemplate->update([
            'body' => HasTranslations::normalizeTranslation($request->input('body')),
            'is_active' => $request->boolean('is_active', $smsTemplate->is_active),
        ]);
        $audit->log('sms.template.updated', "Updated SMS template {$smsTemplate->name}", $smsTemplate);

        return new SmsTemplateResource($smsTemplate);
    }

    public function logs(Request $request, SmsLogRepository $repo): AnonymousResourceCollection
    {
        return SmsLogResource::collection($repo->paginate($request->all(), function ($q) use ($request) {
            foreach (['status', 'event'] as $f) {
                if ($v = $request->query($f)) {
                    $q->where($f, $v);
                }
            }
            if ($g = $request->integer('gateway')) {
                $q->where('sms_gateway_id', $g);
            }
        }))->additional([
            'summary' => [
                'sent' => SmsLog::query()->where('status', 'sent')->count(),
                'failed' => SmsLog::query()->where('status', 'failed')->count(),
                'segments_month' => (int) SmsLog::query()->where('status', 'sent')->where('created_at', '>=', now()->startOfMonth())->sum('segments'),
            ],
        ]);
    }
}
