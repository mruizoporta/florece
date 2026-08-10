<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Support\TenantDataCache;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveTenantFromSubdomain
{
    /**
     * Resuelve el tenant desde subdominio ({slug}.dominio) o, en local, desde ?tenant=slug.
     * Establece Tenant::current() y aborta 404 si no existe.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $slug = $this->resolveTenantSlug($request);

        if (! $slug) {
            abort(404);
        }

        $tenant = TenantDataCache::tenantBySlug($slug);

        if (! $tenant) {
            abort(404);
        }

        $user = $request->user();
        if ($user && $user->tenant_id !== $tenant->id) {
            abort(403, 'No tienes acceso a este salón.');
        }

        Tenant::setCurrent($tenant);
        $request->session()->put('current_tenant_id', $tenant->id);
        $request->session()->put('current_tenant_slug', $tenant->slug);

        return $next($request);
    }

    protected function resolveTenantSlug(Request $request): ?string
    {
        $slug = $request->route('tenant_slug');

        if (filled($slug)) {
            return $slug;
        }

        if (app()->environment('local') && config('tenant.local_query_fallback', true)) {
            $host = $request->getHost();
            if (in_array($host, ['localhost', '127.0.0.1'], true)) {
                $slug = $request->query('tenant');
                return filled($slug) ? $slug : null;
            }
        }

        return null;
    }
}
