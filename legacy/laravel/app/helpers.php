<?php

use App\Models\Tenant;
use App\Services\DemoTenantService;

if (! function_exists('tenant_url')) {
    /**
     * Genera la URL base del tenant actual o del indicado.
     * Subdominio: {slug}.dominio | Local: /s/{slug}
     */
    function tenant_url(string $path = '', ?Tenant $tenant = null): string
    {
        $tenant = $tenant ?? Tenant::current();
        if (! $tenant) {
            return url($path);
        }

        $path = ltrim($path, '/');

        if (app()->environment('local')) {
            return url('s/' . $tenant->slug . ($path ? '/' . $path : ''));
        }

        $scheme = request()->secure() ? 'https' : 'http';
        $domain = config('tenant.domain');

        return $scheme . '://' . $tenant->slug . '.' . $domain . ($path ? '/' . $path : '');
    }
}

if (! function_exists('tenant_route')) {
    /**
     * URL a una ruta nombrada del tenant (subdominio o prefijo /s/{slug} en local).
     */
    function tenant_route(string $name, array $parameters = [], bool $absolute = true): string
    {
        $tenant = Tenant::current();
        $suffix = app()->environment('local') ? '.local' : '';
        $routeName = $name.$suffix;
        $params = $tenant !== null
            ? array_merge(['tenant_slug' => $tenant->slug], $parameters)
            : $parameters;

        return route($routeName, $params, $absolute);
    }
}

if (! function_exists('locale_switch_url')) {
    /**
     * URL para cambiar idioma (sesión), mismo host.
     */
    function locale_switch_url(string $locale): string
    {
        return url('/locale/' . $locale);
    }
}

if (! function_exists('billing_checkout_url')) {
    /**
     * URL a Stripe Checkout para suscribir el tenant (Cashier).
     */
    function billing_checkout_url(?string $plan = null, ?Tenant $tenant = null): string
    {
        $tenant = $tenant ?? Tenant::current();
        $query = array_filter(['plan' => $plan]);

        if (app()->environment('local') && $tenant) {
            return route('billing.checkout.local', array_merge(
                ['tenant_slug' => $tenant->slug],
                $query
            ));
        }

        return route('billing.checkout', $query);
    }
}

if (! function_exists('demo_url')) {
    /**
     * URL del tenant demo. Retorna la home si el demo no existe.
     */
    function demo_url(string $path = ''): string
    {
        return DemoTenantService::demoUrl() . ($path ? '/' . ltrim($path, '/') : '');
    }
}
