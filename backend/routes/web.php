<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => config('app.name').' API',
    'docs' => 'All endpoints are under /api. The SPA runs at '.config('portal.frontend_url'),
]));
