<?php

namespace App\Providers;

use App\Models\Employee;
use App\Models\Product;
use App\Models\Section;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Tenant;
use App\Support\TenantDataCache;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Laravel\Cashier\Cashier;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Cashier::useCustomerModel(Tenant::class);

        $livewireViews = resource_path('views/vendor/livewire');
        if (is_dir($livewireViews)) {
            View::prependNamespace('livewire', $livewireViews);
        }

        $this->registerTenantCacheInvalidation();

        // Evitar Schema::hasTable en cada request (RTT caro si la DB es remota).
    }

    private function registerTenantCacheInvalidation(): void
    {
        $forget = function ($model): void {
            $tenant = Tenant::current();
            if (! $tenant && isset($model->tenant_id)) {
                $tenant = Tenant::withoutGlobalScopes()->find($model->tenant_id);
            }
            TenantDataCache::forgetForTenant($tenant);
        };

        Setting::saved($forget);
        Setting::deleted($forget);
        Section::saved($forget);
        Section::deleted($forget);
        Service::saved($forget);
        Service::deleted($forget);
        Employee::saved($forget);
        Employee::deleted($forget);
        Product::saved($forget);
        Product::deleted($forget);

        Tenant::saved(function (Tenant $tenant): void {
            TenantDataCache::forgetForTenant($tenant);
            TenantDataCache::forgetDemoUrl();
        });
        Tenant::deleted(function (Tenant $tenant): void {
            TenantDataCache::forgetForTenant($tenant);
            TenantDataCache::forgetDemoUrl();
        });
    }
}
