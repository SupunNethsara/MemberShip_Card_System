<?php

return [
    'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/'),
    'currency' => env('PORTAL_CURRENCY', 'LKR'),
    'member_code_prefix' => env('MEMBER_CODE_PREFIX', 'MEM'),
    'invoice_prefix' => env('INVOICE_PREFIX', 'INV'),
    'locales' => ['en', 'si', 'ta'],
    'expiry_reminder_days' => 7,
];
