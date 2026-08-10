<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Tenant;
use App\Services\PlanChangeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SubscriptionController extends Controller
{
    public function __construct(
        protected PlanChangeService $planChange
    ) {}

    /**
     * Suscribe un tenant a un plan.
     *
     * Usa el stripe_price_id según billing_region del tenant.
     * Sincroniza plan_id, subscription_status y subscription_ends_at.
     */
    public function subscribe(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('subscribe', $tenant);

        if ($tenant->isDemo()) {
            abort(403, __('app.demo.billing_forbidden'));
        }

        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
            'billing_email' => ['nullable', 'email'],
            'payment_method' => ['nullable', 'string'],
        ]);

        $plan = Plan::where('slug', $validated['plan_slug'])->firstOrFail();

        $stripePriceId = $plan->getStripePriceIdForRegion($tenant->billing_region);
        if (! $stripePriceId) {
            throw ValidationException::withMessages([
                'plan_slug' => ['No hay precio configurado para la región ' . ($tenant->billing_region ?? 'sin definir') . '.'],
            ]);
        }

        if (! empty($validated['billing_email'])) {
            $tenant->update(['billing_email' => $validated['billing_email']]);
        }

        if (! $tenant->billing_email) {
            throw ValidationException::withMessages([
                'billing_email' => ['Se requiere billing_email para crear el cliente en Stripe.'],
            ]);
        }

        $paymentMethod = $validated['payment_method'] ?? null;

        if (! $tenant->hasStripeId()) {
            $tenant->createAsStripeCustomer();
        }

        try {
            $builder = $tenant->newSubscription('default', $stripePriceId);

            if ($tenant->subscription_status === Tenant::STATUS_PENDING_PAYMENT) {
                $builder->trialDays(config('billing.trial_days'));
            } elseif ($tenant->subscription_status === Tenant::STATUS_TRIAL && $tenant->trial_ends_at?->isFuture()) {
                $builder->trialUntil($tenant->trial_ends_at);
            }

            $subscription = $paymentMethod
                ? $builder->create($paymentMethod)
                : $builder->createAndSendInvoice();

            $subscription->refresh();

            $tenant->update([
                'plan_id' => $plan->id,
                'subscription_status' => ($subscription->stripe_status === 'trialing')
                    ? Tenant::STATUS_TRIAL
                    : Tenant::STATUS_ACTIVE,
                'subscription_ends_at' => $subscription->ends_at,
                'trial_ends_at' => $subscription->trial_ends_at,
            ]);

            return response()->json([
                'message' => 'Suscripción creada correctamente.',
                'tenant' => [
                    'id' => $tenant->id,
                    'stripe_customer_id' => $tenant->stripe_id,
                    'subscription_status' => $tenant->subscription_status,
                ],
                'subscription' => [
                    'id' => $subscription->id,
                    'stripe_subscription_id' => $subscription->stripe_id,
                    'stripe_status' => $subscription->stripe_status,
                ],
            ], 201);
        } catch (\Laravel\Cashier\Exceptions\CustomerAlreadyCreated $e) {
            return response()->json(['message' => 'El cliente ya existe en Stripe.'], 409);
        } catch (\Stripe\Exception\ApiErrorException $e) {
            return response()->json([
                'message' => 'Error de Stripe.',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function showBilling(Tenant $tenant): JsonResponse
    {
        $this->authorize('viewBilling', $tenant);

        $subscription = $tenant->subscription('default');

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'plan' => $tenant->plan?->only(['id', 'name', 'slug']),
                'scheduled_plan' => $tenant->scheduledPlan?->only(['id', 'name', 'slug']),
                'subscription_status' => $tenant->subscription_status,
                'trial_ends_at' => $tenant->trial_ends_at?->toIso8601String(),
                'subscription_ends_at' => $tenant->subscription_ends_at?->toIso8601String(),
                'billing_region' => $tenant->billing_region,
                'billing_email' => $tenant->billing_email,
            ],
            'subscription' => $subscription ? [
                'stripe_id' => $subscription->stripe_id,
                'stripe_status' => $subscription->stripe_status,
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'on_trial' => $subscription->onTrial(),
            ] : null,
        ]);
    }

    public function upgrade(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('changePlan', $tenant);

        if ($tenant->isDemo()) {
            abort(403, __('app.demo.billing_forbidden'));
        }

        if ($tenant->subscription_status === Tenant::STATUS_PENDING_PAYMENT) {
            abort(403, __('salon.pending_title'));
        }

        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $newPlan = Plan::where('slug', $validated['plan_slug'])->firstOrFail();
        $currentPlan = $tenant->plan;

        if (! $currentPlan || ! $newPlan->isHigherThan($currentPlan)) {
            throw ValidationException::withMessages([
                'plan_slug' => ['Solo se permite upgrade a un plan superior.'],
            ]);
        }

        $subscription = $this->planChange->upgrade($tenant, $newPlan);

        return response()->json([
            'message' => 'Upgrade realizado correctamente.',
            'plan' => $newPlan->only(['id', 'name', 'slug']),
            'subscription' => [
                'stripe_id' => $subscription->stripe_id,
                'stripe_status' => $subscription->stripe_status,
            ],
        ]);
    }

    public function downgrade(Request $request, Tenant $tenant): JsonResponse
    {
        $this->authorize('changePlan', $tenant);

        if ($tenant->isDemo()) {
            abort(403, __('app.demo.billing_forbidden'));
        }

        if ($tenant->subscription_status === Tenant::STATUS_PENDING_PAYMENT) {
            abort(403, __('salon.pending_title'));
        }

        $validated = $request->validate([
            'plan_slug' => ['required', 'string', 'exists:plans,slug'],
        ]);

        $newPlan = Plan::where('slug', $validated['plan_slug'])->firstOrFail();
        $currentPlan = $tenant->plan;

        if (! $currentPlan || $newPlan->isHigherThan($currentPlan) || $newPlan->id === $currentPlan->id) {
            throw ValidationException::withMessages([
                'plan_slug' => ['Solo se permite downgrade a un plan inferior distinto.'],
            ]);
        }

        $result = $this->planChange->downgrade($tenant, $newPlan);

        return response()->json([
            'message' => $result['message'],
            'scheduled_plan' => $result['scheduled_plan']->only(['id', 'name', 'slug']),
            'scheduled_at' => $result['scheduled_at'],
        ], 202);
    }
}
