<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::current();

        /**
         * Si el tenant no está en contexto (Livewire u orden de middleware), usar el del usuario.
         * Así el bypass demo y hasActiveSubscription ven el mismo salón que la sesión.
         */
        if (! $tenant && $request->user()?->tenant_id) {
            $tenant = Tenant::withoutGlobalScopes()->find($request->user()->tenant_id);
            if ($tenant) {
                Tenant::setCurrent($tenant);
            }
        }

        if (! $tenant) {
            return $this->redirectToBilling($request);
        }

        /** Salón demo: acceso completo sin Stripe ni validación de suscripción (ver Tenant::isDemo()). */
        if ($tenant->isDemo()) {
            return $next($request);
        }

        if ($tenant->hasActiveSubscription()) {
            return $next($request);
        }

        if ($tenant->subscription_status === Tenant::STATUS_PENDING_PAYMENT) {
            if ($this->allowsPendingPaymentAccess($request)) {
                return $next($request);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => __('salon.pending_title'),
                ], 403);
            }

            $user = $request->user();
            if ($user && (int) $user->tenant_id === (int) $tenant->id && $user->hasRole('Admin')) {
                return redirect()->to(tenant_url('/billing'));
            }

            return response()->view('salon.pending_activation', [], 503);
        }

        if ($tenant->subscription_status === Tenant::STATUS_TRIAL && $tenant->trial_ends_at?->isPast()) {
            $tenant->update(['subscription_status' => Tenant::STATUS_EXPIRED]);
        }

        if ($tenant->hasActiveSubscription()) {
            return $next($request);
        }

        if ($tenant->subscription_status === Tenant::STATUS_PAST_DUE && $this->withinPastDueGrace($tenant)) {
            return $next($request);
        }

        return $this->redirectToBilling($request);
    }

    /**
     * Rutas permitidas mientras el tenant no completó el pago (Stripe).
     * Incluye login (admin/staff), Livewire, assets y cambio de idioma.
     */
    protected function allowsPendingPaymentAccess(Request $request): bool
    {
        $path = $this->normalizedTenantPath($request);

        if ($path === 'login') {
            return true;
        }

        if ($path === 'billing' || $path === 'billing/checkout') {
            return true;
        }

        if (preg_match('#^locale/(es|en)$#', $path)) {
            return true;
        }

        if (str_starts_with($path, 'livewire/')) {
            return true;
        }

        return false;
    }

    /**
     * En local, las rutas usan prefijo s/{slug}/…; el resto del host usa /login, etc.
     */
    protected function normalizedTenantPath(Request $request): string
    {
        $path = trim($request->path(), '/');

        if (app()->environment('local') && preg_match('#^s/[^/]+/(.+)$#', $path, $m)) {
            return $m[1];
        }

        return $path;
    }

    protected function withinPastDueGrace(Tenant $tenant): bool
    {
        $days = config('billing.past_due_grace_days');
        if ($days === null || $days <= 0) {
            return false;
        }

        $pastDueSince = $tenant->past_due_since ?? $tenant->updated_at;
        $start = $pastDueSince instanceof \DateTimeInterface ? $pastDueSince : \Carbon\Carbon::parse($pastDueSince);

        return $start->addDays($days)->isFuture();
    }

    protected function redirectToBilling(Request $request): Response
    {
        /** Red de seguridad: nunca mostrar “suscripción vencida” si el usuario pertenece a un salón demo. */
        if ($request->user()?->tenant_id) {
            $fallback = Tenant::withoutGlobalScopes()->find($request->user()->tenant_id);
            if ($fallback?->isDemo()) {
                Tenant::setCurrent($fallback);

                return redirect()->to(tenant_url('/', $fallback));
            }
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Suscripción inactiva o vencida.',
                'redirect' => '/subscription/expired',
            ], 403);
        }

        return redirect()->to('/subscription/expired');
    }
}
