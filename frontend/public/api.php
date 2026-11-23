<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Polyfill request_parse_body() for PHP < 8.4 so Symfony HTTP Foundation works for PUT/PATCH/DELETE
if (!function_exists('request_parse_body')) {
    function request_parse_body(): array {
        return [$_POST, $_FILES];
    }
}

// Composer autoloader
require '/home/lankacha/portal_backend/vendor/autoload.php';

// Bootstrap
/** @var Application $app */
$app = require_once '/home/lankacha/portal_backend/bootstrap/app.php';

// Capture request
$request = Request::capture();

// If Content-Type is json and $request->all() is empty, check php://input
if (empty($request->all()) && str_contains($request->header('Content-Type') ?? '', 'json')) {
    $raw = file_get_contents('php://input');
    if ($raw && ($data = json_decode($raw, true)) && is_array($data)) {
        $request->merge($data);
    }
}

$app->handleRequest($request);
