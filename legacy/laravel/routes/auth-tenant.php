<?php

use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

Route::middleware(['guest', 'subscription'])->group(function () {
    Volt::route('login', 'pages.auth.login')->name('login.tenant');
    Volt::route('register', 'pages.auth.register')->name('register.tenant');
});
