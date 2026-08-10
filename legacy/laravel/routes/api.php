<?php

use App\Http\Controllers\Api\V1\AppointmentController;
use App\Http\Controllers\Api\V1\Catalog\CatalogCategoriesController;
use App\Http\Controllers\Api\V1\Catalog\CatalogProductsController;
use App\Http\Controllers\Api\V1\Catalog\CatalogServicesController;
use App\Http\Controllers\Api\V1\Catalog\PublicCatalogController;
use App\Http\Controllers\Api\V1\Employees\EmployeeController;
use App\Http\Controllers\Api\V1\Employees\PublicEmployeeController;
use App\Http\Controllers\Api\V1\Orders\OrderItemsController;
use App\Http\Controllers\Api\V1\Orders\OrderPaymentsController;
use App\Http\Controllers\Api\V1\Orders\OrderReportsController;
use App\Http\Controllers\Api\V1\Orders\OrdersController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('tenants/{tenant}/billing', [SubscriptionController::class, 'showBilling'])
        ->name('tenants.billing');
    Route::post('tenants/{tenant}/subscribe', [SubscriptionController::class, 'subscribe'])
        ->name('tenants.subscribe');
    Route::post('tenants/{tenant}/upgrade', [SubscriptionController::class, 'upgrade'])
        ->name('tenants.upgrade');
    Route::post('tenants/{tenant}/downgrade', [SubscriptionController::class, 'downgrade'])
        ->name('tenants.downgrade');
});

Route::prefix('v1')
    ->middleware(['auth:sanctum', 'tenant.context', 'tenant.required'])
    ->group(function () {
        Route::get('appointments/available-slots', [AppointmentController::class, 'availableSlots']);
        Route::get('appointments', [AppointmentController::class, 'index']);
        Route::post('appointments', [AppointmentController::class, 'store']);
        Route::patch('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);

        Route::prefix('catalog')->group(function () {
            Route::get('services', [CatalogServicesController::class, 'index']);
            Route::post('services', [CatalogServicesController::class, 'store']);
            Route::patch('services/{service}', [CatalogServicesController::class, 'update']);
            Route::patch('services/{service}/archive', [CatalogServicesController::class, 'archive']);

            Route::get('products', [CatalogProductsController::class, 'index']);
            Route::post('products', [CatalogProductsController::class, 'store']);

            Route::patch('products/{product}', [CatalogProductsController::class, 'update']);
            Route::patch('products/{product}/archive', [CatalogProductsController::class, 'archive']);
            Route::patch('products/{product}/stock', [CatalogProductsController::class, 'updateStock']);

            Route::get('categories', [CatalogCategoriesController::class, 'index']);
            Route::post('categories', [CatalogCategoriesController::class, 'store']);

            Route::patch('categories/{category}', [CatalogCategoriesController::class, 'update']);
            Route::delete('categories/{category}', [CatalogCategoriesController::class, 'delete']);
        });

        Route::get('employees', [EmployeeController::class, 'index']);
        Route::get('employees/{employee}', [EmployeeController::class, 'show']);
        Route::post('employees', [EmployeeController::class, 'store']);
        Route::patch('employees/{employee}', [EmployeeController::class, 'update']);
        Route::patch('employees/{employee}/archive', [EmployeeController::class, 'archive']);
        Route::get('employees/{employee}/schedule', [EmployeeController::class, 'getSchedule']);
        Route::put('employees/{employee}/schedule', [EmployeeController::class, 'replaceSchedule']);
        Route::patch('employees/{employee}/socials', [EmployeeController::class, 'syncSocials']);

        Route::get('orders/reports/summary', [OrderReportsController::class, 'summary']);
        Route::get('orders/reports/payments', [OrderReportsController::class, 'payments']);
        Route::get('orders/reports/products', [OrderReportsController::class, 'products']);

        Route::get('orders', [OrdersController::class, 'index']);
        Route::post('orders', [OrdersController::class, 'store']);
        Route::get('orders/{order}', [OrdersController::class, 'show']);
        Route::post('orders/{order}/items', [OrderItemsController::class, 'store']);
        Route::patch('orders/{order}/items/{item}', [OrderItemsController::class, 'update']);
        Route::delete('orders/{order}/items/{item}', [OrderItemsController::class, 'destroy']);
        Route::patch('orders/{order}/payments', [OrderPaymentsController::class, 'sync']);
        Route::patch('orders/{order}/finalize', [OrdersController::class, 'finalize']);
        Route::patch('orders/{order}/cancel', [OrdersController::class, 'cancel']);
    });

Route::prefix('v1')
    ->middleware(['tenant.context', 'tenant.required'])
    ->group(function () {
        Route::get('catalog/public', [PublicCatalogController::class, 'index']);
        Route::get('employees/public', [PublicEmployeeController::class, 'index']);
    });
