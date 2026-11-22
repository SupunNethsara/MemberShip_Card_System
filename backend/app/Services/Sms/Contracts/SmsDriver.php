<?php

namespace App\Services\Sms\Contracts;

use App\Models\SmsGateway;
use App\Services\Sms\SmsResult;

interface SmsDriver
{
    public function __construct(SmsGateway $gateway);

    /** @return array{label:string, description:string, credentials:array, settings:array} */
    public static function definition(): array;

    /** @param string $to Normalized MSISDN, e.g. 94771234567 */
    public function send(string $to, string $message): SmsResult;
}
