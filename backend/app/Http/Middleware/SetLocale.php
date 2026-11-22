<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Applies the SPA's Accept-Language (en | si | ta) to the request. */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = substr((string) $request->header('Accept-Language', 'en'), 0, 2);
        app()->setLocale(in_array($locale, config('portal.locales'), true) ? $locale : 'en');

        return $next($request);
    }
}
