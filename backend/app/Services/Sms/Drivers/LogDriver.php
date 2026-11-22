<?php

namespace App\Services\Sms\Drivers;

use App\Services\Sms\SmsResult;
use Illuminate\Support\Facades\Log;

/** Development driver: writes messages to storage/logs/laravel.log instead of sending. */
class LogDriver extends AbstractSmsDriver
{
    public static function definition(): array
    {
        return [
            'label' => 'Log (Development)',
            'description' => 'Writes SMS to the application log. Use for local development & QA.',
            'credentials' => [],
            'settings' => [],
        ];
    }

    public function send(string $to, string $message): SmsResult
    {
        Log::channel(config('logging.default'))->info('[SMS] '.$to.' :: '.$message, ['gateway' => $this->gateway->name]);

        return new SmsResult(true, 200, json_encode(['status' => 'logged', 'to' => $to, 'length' => mb_strlen($message)]));
    }
}
