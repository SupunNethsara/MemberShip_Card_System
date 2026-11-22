<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveAccount
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->status === 'suspended') {
            $request->user()->currentAccessToken()?->delete();
            abort(401, 'Account suspended.');
        }

        return $next($request);
    }
}
