<?php

namespace App\Livewire\Dashboard;

use App\Models\Plan;
use App\Models\Tenant;
use App\Services\PlanChangeService;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class BillingComponent extends Component
{
    public function getTenantProperty(): ?Tenant
    {
        $user = Auth::user();
        if (! $user?->tenant_id) {
            return null;
        }

        return Tenant::withoutGlobalScopes()->find($user->tenant_id);
    }

    public function getPlansProperty()
    {
        return Plan::orderBy('slug')->get();
    }

    public function upgrade(string $planSlug): void
    {
        $tenant = $this->tenant;
        if (! $tenant) {
            $this->addError('plan', 'No se encontró el salón.');
            return;
        }

        $this->authorize('changePlan', $tenant);

        if ($tenant->isDemo()) {
            $this->addError('plan', __('billing.demo_no_plan_change'));

            return;
        }

        $newPlan = Plan::where('slug', $planSlug)->firstOrFail();
        $currentPlan = $tenant->plan;

        if (! $currentPlan || ! $newPlan->isHigherThan($currentPlan)) {
            $this->addError('plan', 'Solo se permite upgrade a un plan superior.');
            return;
        }

        try {
            app(PlanChangeService::class)->upgrade($tenant, $newPlan);
            $this->dispatch('billing-updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            foreach ($e->errors() as $key => $messages) {
                $this->addError($key, $messages[0]);
            }
        } catch (\Throwable $e) {
            $this->addError('plan', $e->getMessage());
        }
    }

    public function downgrade(string $planSlug): void
    {
        $tenant = $this->tenant;
        if (! $tenant) {
            $this->addError('plan', 'No se encontró el salón.');
            return;
        }

        $this->authorize('changePlan', $tenant);

        if ($tenant->isDemo()) {
            $this->addError('plan', __('billing.demo_no_plan_change'));

            return;
        }

        $newPlan = Plan::where('slug', $planSlug)->firstOrFail();
        $currentPlan = $tenant->plan;

        if (! $currentPlan || $newPlan->isHigherThan($currentPlan) || $newPlan->id === $currentPlan->id) {
            $this->addError('plan', 'Solo se permite downgrade a un plan inferior distinto.');
            return;
        }

        try {
            app(PlanChangeService::class)->downgrade($tenant, $newPlan);
            $this->dispatch('billing-updated');
        } catch (\Illuminate\Validation\ValidationException $e) {
            foreach ($e->errors() as $key => $messages) {
                $this->addError($key, $messages[0]);
            }
        } catch (\Throwable $e) {
            $this->addError('plan', $e->getMessage());
        }
    }

    public function render()
    {
        return view('livewire.dashboard.billing-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.billing')]);
    }
}
