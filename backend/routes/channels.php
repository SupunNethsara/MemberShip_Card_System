<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['prefix' => 'api', 'middleware' => ['auth:sanctum']]);

Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (string) $user->id === (string) $id;
});

Broadcast::channel('staff', function (User $user) {
    return (bool) $user->is_staff;
});
