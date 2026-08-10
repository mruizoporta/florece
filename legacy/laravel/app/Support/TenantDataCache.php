<?php

namespace App\Support;

use App\Models\Employee;
use App\Models\Product;
use App\Models\Section;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class TenantDataCache
{
    private const TTL_TENANT = 600;

    private const TTL_SETTINGS = 300;

    private const TTL_PUBLIC = 120;

    /** @var array<string, mixed> */
    private static array $requestMemo = [];

    public static function tenantBySlug(string $slug): ?Tenant
    {
        $slug = strtolower(trim($slug));
        $memoKey = 'tenant:slug:'.$slug;

        if (array_key_exists($memoKey, self::$requestMemo)) {
            return self::$requestMemo[$memoKey];
        }

        $tenant = Cache::remember(self::tenantSlugKey($slug), self::TTL_TENANT, function () use ($slug) {
            return Tenant::withoutGlobalScopes()
                ->with('plan')
                ->where('slug', $slug)
                ->first();
        });

        return self::$requestMemo[$memoKey] = $tenant;
    }

    public static function setting(?Tenant $tenant = null): ?Setting
    {
        $tenant ??= Tenant::current();
        if (! $tenant) {
            return Setting::query()->first();
        }

        $memoKey = 'setting:'.$tenant->id;
        if (array_key_exists($memoKey, self::$requestMemo)) {
            return self::$requestMemo[$memoKey];
        }

        $previous = Tenant::current();
        Tenant::setCurrent($tenant);

        try {
            $setting = Cache::remember(self::settingKey($tenant->id), self::TTL_SETTINGS, function () {
                return Setting::query()->first();
            });
        } finally {
            Tenant::setCurrent($previous);
        }

        return self::$requestMemo[$memoKey] = $setting;
    }

    public static function section(?Tenant $tenant = null): ?Section
    {
        $tenant ??= Tenant::current();
        if (! $tenant) {
            return Section::query()->first();
        }

        $memoKey = 'section:'.$tenant->id;
        if (array_key_exists($memoKey, self::$requestMemo)) {
            return self::$requestMemo[$memoKey];
        }

        $previous = Tenant::current();
        Tenant::setCurrent($tenant);

        try {
            $section = Cache::remember(self::sectionKey($tenant->id), self::TTL_SETTINGS, function () {
                return Section::query()->first();
            });
        } finally {
            Tenant::setCurrent($previous);
        }

        return self::$requestMemo[$memoKey] = $section;
    }

    /**
     * Catálogo público del salón (servicios / empleados / productos).
     *
     * @return array{services: Collection, employees: Collection, products: Collection}
     */
    public static function publicCatalog(Tenant $tenant, bool $withEmployees, bool $withProducts): array
    {
        $memoKey = 'catalog:'.$tenant->id.':'.(int) $withEmployees.':'.(int) $withProducts;
        if (array_key_exists($memoKey, self::$requestMemo)) {
            return self::$requestMemo[$memoKey];
        }

        $previous = Tenant::current();
        Tenant::setCurrent($tenant);

        try {
            $catalog = Cache::remember(
                self::catalogKey($tenant->id, $withEmployees, $withProducts),
                self::TTL_PUBLIC,
                function () use ($withEmployees, $withProducts) {
                    return [
                        'services' => Service::with('item')->get(),
                        'employees' => $withEmployees
                            ? Employee::where('status', true)->get()
                            : collect(),
                        'products' => $withProducts
                            ? Product::with(['item.category', 'images'])->get()
                            : collect(),
                    ];
                }
            );
        } finally {
            Tenant::setCurrent($previous);
        }

        return self::$requestMemo[$memoKey] = $catalog;
    }

    /**
     * Empleados y servicios activos para la agenda pública.
     *
     * @return array{employees: Collection, services: Collection}
     */
    public static function bookingCatalog(?Tenant $tenant = null): array
    {
        $tenant ??= Tenant::current();
        if (! $tenant) {
            return [
                'employees' => Employee::where('status', true)->get(),
                'services' => Service::with('item')
                    ->whereHas('item', fn ($q) => $q->where('status', true))
                    ->get(),
            ];
        }

        $memoKey = 'booking:'.$tenant->id;
        if (array_key_exists($memoKey, self::$requestMemo)) {
            return self::$requestMemo[$memoKey];
        }

        $previous = Tenant::current();
        Tenant::setCurrent($tenant);

        try {
            $catalog = Cache::remember(
                self::bookingKey($tenant->id),
                self::TTL_PUBLIC,
                function () {
                    return [
                        'employees' => Employee::where('status', true)->get(),
                        'services' => Service::with('item')
                            ->whereHas('item', fn ($q) => $q->where('status', true))
                            ->get(),
                    ];
                }
            );
        } finally {
            Tenant::setCurrent($previous);
        }

        return self::$requestMemo[$memoKey] = $catalog;
    }

    public static function forgetForTenant(?Tenant $tenant): void
    {
        if (! $tenant) {
            return;
        }

        Cache::forget(self::tenantSlugKey($tenant->slug));
        Cache::forget(self::settingKey($tenant->id));
        Cache::forget(self::sectionKey($tenant->id));
        Cache::forget(self::bookingKey($tenant->id));

        foreach ([false, true] as $employees) {
            foreach ([false, true] as $products) {
                Cache::forget(self::catalogKey($tenant->id, $employees, $products));
            }
        }

        self::$requestMemo = [];
    }

    public static function forgetDemoUrl(): void
    {
        Cache::forget('demo:tenant:url');
    }

    public static function demoUrl(): string
    {
        return Cache::remember('demo:tenant:url', self::TTL_TENANT, function () {
            $tenant = Tenant::withoutGlobalScopes()
                ->where('slug', \App\Services\DemoTenantService::DEMO_SLUG)
                ->first();

            if (! $tenant) {
                return url('/');
            }

            return tenant_url('/', $tenant);
        });
    }

    private static function tenantSlugKey(string $slug): string
    {
        return 'tenant:slug:v1:'.$slug;
    }

    private static function settingKey(int $tenantId): string
    {
        return 'tenant:'.$tenantId.':setting:v1';
    }

    private static function sectionKey(int $tenantId): string
    {
        return 'tenant:'.$tenantId.':section:v1';
    }

    private static function catalogKey(int $tenantId, bool $withEmployees, bool $withProducts): string
    {
        return 'tenant:'.$tenantId.':catalog:v1:'.(int) $withEmployees.':'.(int) $withProducts;
    }

    private static function bookingKey(int $tenantId): string
    {
        return 'tenant:'.$tenantId.':booking:v1';
    }
}
