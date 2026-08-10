<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\BillingCheckoutController;
use App\Http\Controllers\LocaleController;

use App\Livewire\Frontend\SalonPublicPage;

use App\Livewire\Frontend\AppointmentCreateComponent as FrontendAppointmentCreateComponent;

use App\Livewire\Frontend\ProfileComponent;

use App\Livewire\Auth\RegisterSalon;

use App\Livewire\Dashboard\HomeComponent;
use App\Livewire\Dashboard\AppointmentComponent;
use App\Livewire\Dashboard\AppointmentCreateComponent;
use App\Livewire\Dashboard\BoardComponent;
use App\Livewire\Dashboard\CalendarComponent;
use App\Livewire\Dashboard\CategoryComponent;
use App\Livewire\Dashboard\EmployeeComponent;
use App\Livewire\Dashboard\EmployeeCreateComponent;
use App\Livewire\Dashboard\EmployeeEditComponent;
use App\Livewire\Dashboard\InstagramFeedComponent;
use App\Livewire\Dashboard\ItemCreateComponent;
use App\Livewire\Dashboard\OrderComponent;
use App\Livewire\Dashboard\OrderShowComponent;
use App\Livewire\Dashboard\OrderPrintComponent;
use App\Livewire\Dashboard\ProductComponent;
use App\Livewire\Dashboard\ProductEditComponent;
use App\Livewire\Dashboard\SectionComponent;
use App\Livewire\Dashboard\ServiceComponent;
use App\Livewire\Dashboard\ServiceEditComponent;
use App\Livewire\Dashboard\SettingsComponent;
use App\Livewire\Dashboard\SettingsImagesComponent;
use App\Livewire\Dashboard\SponsorComponent;
use App\Livewire\Dashboard\UserComponent;

/*
|--------------------------------------------------------------------------
| Rutas dominio principal (sin tenant)
|--------------------------------------------------------------------------
| Landing, registro de salones, login. Sin subdominio.
*/
$mainDomain = config('tenant.domain');

Route::domain($mainDomain)->middleware('web')->group(function () {
    Route::get('/', \App\Livewire\Frontend\LandingPage::class)->name('welcome');

    Route::middleware('guest')->group(function () {
        Route::get('/registrar-salon', RegisterSalon::class)->name('register.salon');
    });

    Route::get('/logout', [LogoutController::class, 'logout'])->name('logout');
    Route::get('/subscription/expired', fn () => response()->view('subscription.expired', [], 403))
        ->name('subscription.expired');

    require __DIR__.'/auth.php';
});

/*
|--------------------------------------------------------------------------
| Rutas subdominio ({slug}.dominio) — tenant requerido
|--------------------------------------------------------------------------
| Página pública del salón, agenda, dashboard. Requiere subdominio con slug.
*/
Route::domain('{tenant_slug}.'.$mainDomain)
    ->middleware(['web', 'tenant.subdomain'])
    ->group(function () {
        require __DIR__.'/auth-tenant.php';

        Route::middleware(['subscription'])->group(function () {
            Route::get('/', SalonPublicPage::class)->name('salon.public');
            Route::get('/nueva-agenda', FrontendAppointmentCreateComponent::class)->name('appointments.create');
        });

        Route::middleware(['auth', 'subscription'])->group(function () {
            Route::get('/profile', fn () => view('profile'))->name('profile');
            Route::group(['middleware' => ['role:Customer']], function () {
                Route::get('/mi-cuenta', ProfileComponent::class)->name('profile.customer');
            });
        });

        Route::middleware(['auth'])->group(function () {
            Route::get('/billing/checkout', BillingCheckoutController::class)
                ->middleware('role:Admin')
                ->name('billing.checkout');
            Route::get('/billing', \App\Livewire\Dashboard\BillingComponent::class)
                ->middleware('role:Admin')
                ->name('billing');
        });

        Route::middleware(['auth', 'subscription'])->group(function () {
            Route::group(['middleware' => ['role:Admin']], function () {
                Route::get('/dashboard', HomeComponent::class)->name('dashboard');
                Route::get('/dashboard/appointments', AppointmentComponent::class)->name('dashboard.appointments');
                Route::get('/dashboard/appointments/create', AppointmentCreateComponent::class)->name('dashboard.appointments.create');
                Route::get('/dashboard/board', BoardComponent::class)->name('dashboard.board');
                Route::get('/dashboard/calendar', CalendarComponent::class)->name('dashboard.calendar');
                Route::get('/dashboard/categories', CategoryComponent::class)->name('dashboard.categories');
                Route::get('/dashboard/employees', EmployeeComponent::class)->name('dashboard.employees');
                Route::get('/dashboard/employees/create', EmployeeCreateComponent::class)->name('dashboard.employees.create');
                Route::get('/dashboard/employees/{id}/edit', EmployeeEditComponent::class)->name('dashboard.employees.edit');
                Route::get('/dashboard/instagram_feeds', InstagramFeedComponent::class)->name('dashboard.instagram_feeds');
                Route::get('/dashboard/items/create', ItemCreateComponent::class)->name('dashboard.items.create');
                Route::get('/dashboard/orders', OrderComponent::class)->name('dashboard.orders');
                Route::get('/dashboard/orders/{order}', OrderShowComponent::class)->name('dashboard.orders.show');
                Route::get('/dashboard/orders/print/{order}', OrderPrintComponent::class)->name('dashboard.orders.print');
                Route::get('/dashboard/products', ProductComponent::class)->name('dashboard.products');
                Route::get('/dashboard/products/{id}/edit', ProductEditComponent::class)->name('dashboard.products.edit');
                Route::get('/dashboard/sections', SectionComponent::class)->name('dashboard.sections');
                Route::get('/dashboard/services', ServiceComponent::class)->name('dashboard.services');
                Route::get('/dashboard/services/{id}/edit', ServiceEditComponent::class)->name('dashboard.services.edit');
                Route::get('/dashboard/settings', SettingsComponent::class)->name('dashboard.settings');
                Route::get('/dashboard/settings_images', SettingsImagesComponent::class)->name('dashboard.settings.images');
                Route::get('/dashboard/sponsors', SponsorComponent::class)->name('dashboard.sponsors');
                Route::get('/dashboard/users', UserComponent::class)->name('dashboard.users');
            });
        });
    });

/*
|--------------------------------------------------------------------------
| Fallback local: /s/{slug}/* (sin subdominios en localhost)
|--------------------------------------------------------------------------
*/
if (app()->environment('local')) {
    Route::prefix('s/{tenant_slug}')
        ->middleware(['web', 'tenant.subdomain'])
        ->group(function () {
            Route::middleware(['guest', 'subscription'])->group(function () {
                \Livewire\Volt\Volt::route('login', 'pages.auth.login')->name('login.tenant.local');
                \Livewire\Volt\Volt::route('register', 'pages.auth.register')->name('register.tenant.local');
            });

            Route::middleware(['subscription'])->group(function () {
                Route::get('/', SalonPublicPage::class)->name('salon.public.local');
                Route::get('/nueva-agenda', FrontendAppointmentCreateComponent::class)->name('appointments.create.local');
            });

            Route::middleware(['auth', 'subscription'])->group(function () {
                Route::get('/profile', fn () => view('profile'))->name('profile.local');
                Route::group(['middleware' => ['role:Customer']], function () {
                    Route::get('/mi-cuenta', ProfileComponent::class)->name('profile.customer.local');
                });
            });

            Route::middleware(['auth'])->group(function () {
                Route::get('/billing/checkout', BillingCheckoutController::class)
                    ->middleware('role:Admin')
                    ->name('billing.checkout.local');
                Route::get('/billing', \App\Livewire\Dashboard\BillingComponent::class)
                    ->middleware('role:Admin')
                    ->name('billing.local');
            });

            Route::middleware(['auth', 'subscription'])->group(function () {
                Route::group(['middleware' => ['role:Admin']], function () {
                    Route::get('/dashboard', HomeComponent::class)->name('dashboard.local');
                    Route::get('/dashboard/appointments', AppointmentComponent::class)->name('dashboard.appointments.local');
                    Route::get('/dashboard/appointments/create', AppointmentCreateComponent::class)->name('dashboard.appointments.create.local');
                    Route::get('/dashboard/board', BoardComponent::class)->name('dashboard.board.local');
                    Route::get('/dashboard/calendar', CalendarComponent::class)->name('dashboard.calendar.local');
                    Route::get('/dashboard/categories', CategoryComponent::class)->name('dashboard.categories.local');
                    Route::get('/dashboard/employees', EmployeeComponent::class)->name('dashboard.employees.local');
                    Route::get('/dashboard/employees/create', EmployeeCreateComponent::class)->name('dashboard.employees.create.local');
                    Route::get('/dashboard/employees/{id}/edit', EmployeeEditComponent::class)->name('dashboard.employees.edit.local');
                    Route::get('/dashboard/instagram_feeds', InstagramFeedComponent::class)->name('dashboard.instagram_feeds.local');
                    Route::get('/dashboard/items/create', ItemCreateComponent::class)->name('dashboard.items.create.local');
                    Route::get('/dashboard/orders', OrderComponent::class)->name('dashboard.orders.local');
                    Route::get('/dashboard/orders/{order}', OrderShowComponent::class)->name('dashboard.orders.show.local');
                    Route::get('/dashboard/orders/print/{order}', OrderPrintComponent::class)->name('dashboard.orders.print.local');
                    Route::get('/dashboard/products', ProductComponent::class)->name('dashboard.products.local');
                    Route::get('/dashboard/products/{id}/edit', ProductEditComponent::class)->name('dashboard.products.edit.local');
                    Route::get('/dashboard/sections', SectionComponent::class)->name('dashboard.sections.local');
                    Route::get('/dashboard/services', ServiceComponent::class)->name('dashboard.services.local');
                    Route::get('/dashboard/services/{id}/edit', ServiceEditComponent::class)->name('dashboard.services.edit.local');
                    Route::get('/dashboard/settings', SettingsComponent::class)->name('dashboard.settings.local');
                    Route::get('/dashboard/settings_images', SettingsImagesComponent::class)->name('dashboard.settings.images.local');
                    Route::get('/dashboard/sponsors', SponsorComponent::class)->name('dashboard.sponsors.local');
                    Route::get('/dashboard/users', UserComponent::class)->name('dashboard.users.local');
                });
            });
        });
}

/*
|--------------------------------------------------------------------------
| Idioma (cualquier host, misma sesión)
|--------------------------------------------------------------------------
*/
Route::middleware('web')->group(function () {
    Route::get('/locale/{locale}', [LocaleController::class, 'set'])
        ->whereIn('locale', ['es', 'en'])
        ->name('locale.set');
});
