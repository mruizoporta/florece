<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCurrentTenant
{
    /**
     * Resuelve el tenant: ya en contexto, sesión (Livewire), o usuario autenticado.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Tenant::current() !== null) {
            return $next($request);
        }

        $sessionTenantId = $request->session()->get('current_tenant_id');
        if ($sessionTenantId) {
            $tenant = Tenant::withoutGlobalScopes()->with('plan')->find($sessionTenantId);
            if ($tenant) {
                Tenant::setCurrent($tenant);

                return $next($request);
            }
        }

        if ($request->user()?->tenant_id) {
            Tenant::setCurrent(
                Tenant::withoutGlobalScopes()->with('plan')->find($request->user()->tenant_id)
            );
        }

        return $next($request);
    }
}
