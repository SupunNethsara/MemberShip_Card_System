<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => config('app.name').' API',
    'docs' => 'All endpoints are under /api. The SPA runs at '.config('portal.frontend_url'),
]));

Route::get('/login', fn () => response()->json([
    'message' => 'Unauthenticated.',
], 401))->name('login');
