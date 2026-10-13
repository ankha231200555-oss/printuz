<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:60,1'])->group(function () {
    Route::get('/public-info', fn () => ['status' => 'ok']);
});
