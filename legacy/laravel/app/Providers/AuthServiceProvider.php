<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\Category;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Order;
use App\Models\Product;
use App\Models\Service;
use App\Models\Tenant;
use App\Policies\AppointmentPolicy;
use App\Policies\CatalogPolicy;
use App\Policies\EmployeePolicy;
use App\Policies\OrderPolicy;
use App\Policies\TenantPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Tenant::class => TenantPolicy::class,
        Appointment::class => AppointmentPolicy::class,
        Item::class => CatalogPolicy::class,
        Service::class => CatalogPolicy::class,
        Product::class => CatalogPolicy::class,
        Category::class => CatalogPolicy::class,
        Employee::class => EmployeePolicy::class,
        Order::class => OrderPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
