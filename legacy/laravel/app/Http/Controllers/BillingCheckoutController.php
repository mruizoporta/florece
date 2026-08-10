<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BillingCheckoutController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = Auth::user();
        if (! $user?->tenant_id) {
            abort(403);
        }

        $tenant = Tenant::withoutGlobalScopes()->findOrFail($user->tenant_id);
        $this->authorize('subscribe', $tenant);

        if ($tenant->isDemo()) {
            abort(403, __('app.demo.billing_forbidden'));
        }

        if ($tenant->subscribed('default')) {
            return redirect()->to(tenant_url('/billing', $tenant))
                ->with('info', __('billing.already_subscribed'));
        }

        $planSlug = $request->query('plan', $tenant->plan?->slug ?? 'basico');
        $plan = Plan::where('slug', $planSlug)->firstOrFail();

        $stripePriceId = $plan->getStripePriceIdForRegion($tenant->billing_region);
        if (! $stripePriceId || str_contains($stripePriceId, 'xxx')) {
            return redirect()->to(tenant_url('/billing', $tenant))
                ->with('error', __('billing.stripe_price_missing'));
        }

        if (! $tenant->billing_email) {
            $tenant->update(['billing_email' => $user->email]);
        }

        $builder = $tenant->newSubscription('default', $stripePriceId);

        if ($tenant->subscription_status === Tenant::STATUS_PENDING_PAYMENT) {
            $builder->trialDays(config('billing.trial_days'));
        } elseif ($tenant->subscription_status === Tenant::STATUS_TRIAL && $tenant->trial_ends_at?->isFuture()) {
            $builder->trialUntil($tenant->trial_ends_at);
        }

        $successUrl = tenant_url('/billing', $tenant).'?checkout=success';
        $cancelUrl = tenant_url('/billing', $tenant).'?checkout=cancelled';

        $checkout = $builder->checkout([
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return redirect()->away($checkout->url);
    }
}
