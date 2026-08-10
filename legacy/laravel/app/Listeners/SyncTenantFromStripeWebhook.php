<?php

namespace App\Listeners;

use App\Models\Plan;
use App\Models\Tenant;
use Carbon\Carbon;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookHandled;

class SyncTenantFromStripeWebhook
{
    public function handle(WebhookHandled $event): void
    {
        $payload = $event->payload;
        $type = $payload['type'] ?? null;

        match ($type) {
            'customer.subscription.created' => $this->handleSubscriptionCreated($payload),
            'customer.subscription.updated' => $this->handleSubscriptionUpdated($payload),
            'customer.subscription.deleted' => $this->handleSubscriptionDeleted($payload),
            'invoice.payment_failed' => $this->handleInvoicePaymentFailed($payload),
            'invoice.payment_succeeded' => $this->handleInvoicePaymentSucceeded($payload),
            default => null,
        };
    }

    protected function handleSubscriptionCreated(array $payload): void
    {
        $tenant = $this->findTenantByStripeCustomerId($payload['data']['object']['customer'] ?? null);
        if (! $tenant) {
            return;
        }

        $data = $payload['data']['object'];
        $plan = $this->resolvePlanFromSubscription($data);
        $status = $this->mapStripeStatusToTenant($data['status'] ?? null);

        $tenant->update([
            'plan_id' => $plan?->id,
            'subscription_status' => $status,
            'subscription_ends_at' => null,
            'trial_ends_at' => isset($data['trial_end'])
                ? Carbon::createFromTimestamp($data['trial_end'])
                : null,
        ]);
    }

    protected function handleSubscriptionUpdated(array $payload): void
    {
        $tenant = $this->findTenantByStripeCustomerId($payload['data']['object']['customer'] ?? null);
        if (! $tenant) {
            return;
        }

        $data = $payload['data']['object'];
        $plan = $this->resolvePlanFromSubscription($data);
        $status = $this->mapStripeStatusToTenant($data['status'] ?? null);

        $endsAt = null;
        if (! empty($data['cancel_at_period_end']) && $data['status'] !== 'canceled') {
            $endsAt = isset($data['current_period_end'])
                ? Carbon::createFromTimestamp($data['current_period_end'])
                : null;
        } elseif (isset($data['cancel_at'])) {
            $endsAt = Carbon::createFromTimestamp($data['cancel_at']);
        } elseif (isset($data['canceled_at'])) {
            $endsAt = Carbon::createFromTimestamp($data['canceled_at']);
        }

        $updates = [
            'plan_id' => $plan?->id ?? $tenant->plan_id,
            'subscription_status' => $status,
            'subscription_ends_at' => $endsAt,
            'trial_ends_at' => isset($data['trial_end'])
                ? Carbon::createFromTimestamp($data['trial_end'])
                : $tenant->trial_ends_at,
        ];
        if ($plan) {
            $updates['scheduled_plan_id'] = null;
        }
        if ($status === Tenant::STATUS_PAST_DUE && $tenant->subscription_status !== Tenant::STATUS_PAST_DUE) {
            $updates['past_due_since'] = now();
        } elseif ($status !== Tenant::STATUS_PAST_DUE) {
            $updates['past_due_since'] = null;
        }
        $tenant->update($updates);
    }

    protected function handleSubscriptionDeleted(array $payload): void
    {
        $tenant = $this->findTenantByStripeCustomerId($payload['data']['object']['customer'] ?? null);
        if (! $tenant) {
            return;
        }

        $tenant->update([
            'subscription_status' => Tenant::STATUS_CANCELED,
            'subscription_ends_at' => now(),
            'scheduled_plan_id' => null,
        ]);
    }

    protected function handleInvoicePaymentFailed(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        $tenant = $this->findTenantByStripeCustomerId($customerId);
        if (! $tenant) {
            return;
        }

        $subscriptionId = $payload['data']['object']['subscription'] ?? null;
        if (! $subscriptionId) {
            return;
        }

        $subscription = $tenant->subscriptions()->where('stripe_id', $subscriptionId)->first();
        if ($subscription) {
            $tenant->update([
                'subscription_status' => Tenant::STATUS_PAST_DUE,
                'past_due_since' => $tenant->subscription_status !== Tenant::STATUS_PAST_DUE ? now() : $tenant->past_due_since,
            ]);
        }
    }

    protected function handleInvoicePaymentSucceeded(array $payload): void
    {
        $customerId = $payload['data']['object']['customer'] ?? null;
        $tenant = $this->findTenantByStripeCustomerId($customerId);
        if (! $tenant) {
            return;
        }

        $subscriptionId = $payload['data']['object']['subscription'] ?? null;
        if (! $subscriptionId) {
            return;
        }

        $subscription = $tenant->subscriptions()->where('stripe_id', $subscriptionId)->first();
        if ($subscription && $tenant->subscription_status === Tenant::STATUS_PAST_DUE) {
            $tenant->update([
                'subscription_status' => Tenant::STATUS_ACTIVE,
                'past_due_since' => null,
            ]);
        }
    }

    protected function findTenantByStripeCustomerId(?string $stripeId): ?Tenant
    {
        if (! $stripeId) {
            return null;
        }

        return Cashier::findBillable($stripeId);
    }

    protected function resolvePlanFromSubscription(array $data): ?Plan
    {
        $items = $data['items']['data'] ?? [];
        $firstPriceId = $items[0]['price']['id'] ?? null;

        return $firstPriceId ? Plan::findByStripePriceId($firstPriceId) : null;
    }

    protected function mapStripeStatusToTenant(?string $stripeStatus): string
    {
        return match ($stripeStatus) {
            'active' => Tenant::STATUS_ACTIVE,
            'trialing' => Tenant::STATUS_TRIAL,
            'past_due' => Tenant::STATUS_PAST_DUE,
            'canceled' => Tenant::STATUS_CANCELED,
            'unpaid', 'incomplete_expired' => Tenant::STATUS_EXPIRED,
            'incomplete' => Tenant::STATUS_PAST_DUE,
            default => Tenant::STATUS_EXPIRED,
        };
    }
}
