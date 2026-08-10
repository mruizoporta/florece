<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Tenant;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Subscription;

class PlanChangeService
{
    /**
     * Upgrade: cambio inmediato con prorrateo.
     */
    public function upgrade(Tenant $tenant, Plan $newPlan): Subscription
    {
        if ($tenant->isDemo()) {
            throw ValidationException::withMessages([
                'plan' => [__('app.demo.billing_forbidden')],
            ]);
        }

        $subscription = $tenant->subscription('default');
        if (! $subscription) {
            throw ValidationException::withMessages([
                'plan' => ['No hay suscripción activa para cambiar.'],
            ]);
        }

        $stripePriceId = $newPlan->getStripePriceIdForRegion($tenant->billing_region);
        if (! $stripePriceId) {
            throw ValidationException::withMessages([
                'plan' => ['No hay precio configurado para tu región.'],
            ]);
        }

        $subscription->swapAndInvoice($stripePriceId);

        $tenant->update([
            'plan_id' => $newPlan->id,
            'subscription_status' => Tenant::STATUS_ACTIVE,
            'subscription_ends_at' => null,
        ]);

        return $subscription->fresh();
    }

    /**
     * Downgrade: cambio programado al final del período actual (Subscription Schedule).
     */
    public function downgrade(Tenant $tenant, Plan $newPlan): array
    {
        if ($tenant->isDemo()) {
            throw ValidationException::withMessages([
                'plan' => [__('app.demo.billing_forbidden')],
            ]);
        }

        if ($tenant->scheduled_plan_id) {
            throw ValidationException::withMessages([
                'plan' => ['Ya tienes un cambio de plan programado. Espera a que se aplique.'],
            ]);
        }

        $exceeds = $newPlan->exceedsLimits($tenant);
        if (! empty($exceeds)) {
            $messages = [];
            foreach ($exceeds as $key => $data) {
                $messages[$key] = sprintf(
                    '%s: tienes %d, el plan permite %d. Reduce antes de hacer downgrade.',
                    $key === 'employees' ? 'Empleados' : 'Servicios',
                    $data['current'],
                    $data['limit']
                );
            }
            throw ValidationException::withMessages($messages);
        }

        $subscription = $tenant->subscription('default');
        if (! $subscription) {
            throw ValidationException::withMessages([
                'plan' => ['No hay suscripción activa para cambiar.'],
            ]);
        }

        $stripePriceId = $newPlan->getStripePriceIdForRegion($tenant->billing_region);
        if (! $stripePriceId) {
            throw ValidationException::withMessages([
                'plan' => ['No hay precio configurado para tu región.'],
            ]);
        }

        $stripe = Cashier::stripe();

        $schedule = $stripe->subscriptionSchedules->create([
            'from_subscription' => $subscription->stripe_id,
        ]);

        $currentPhase = $schedule->phases[0];
        $periodEnd = $currentPhase['end_date'];

        $stripe->subscriptionSchedules->update($schedule->id, [
            'end_behavior' => 'release',
            'phases' => [
                [
                    'items' => $currentPhase['items'],
                    'start_date' => $currentPhase['start_date'],
                    'end_date' => $periodEnd,
                ],
                [
                    'items' => [['price' => $stripePriceId, 'quantity' => 1]],
                    'start_date' => $periodEnd,
                    'proration_behavior' => 'none',
                    'duration' => ['interval' => 'year', 'interval_count' => 10],
                ],
            ],
        ]);

        $tenant->update([
            'scheduled_plan_id' => $newPlan->id,
        ]);

        return [
            'subscription' => $subscription->fresh(),
            'scheduled_at' => $periodEnd,
            'scheduled_plan' => $newPlan,
            'message' => 'El downgrade se aplicará al final del período de facturación actual.',
        ];
    }
}
