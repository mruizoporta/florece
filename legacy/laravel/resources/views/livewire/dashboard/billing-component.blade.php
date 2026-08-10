@section('title', 'Facturación')

@section('content')
<div class="container-fluid">
    <div class="mb-3">
        <h4>Facturación</h4>
    </div>

    @if (! $this->tenant)
        <div class="alert alert-warning">No se encontró el salón asociado.</div>
        @return
    @endif

    @cannot('viewBilling', $this->tenant)
        <div class="alert alert-danger">No tienes permiso para ver esta página.</div>
        @return
    @endcannot

    @if ($this->tenant->isDemo())
        <div class="alert alert-info mb-3">{{ __('billing.demo_notice') }}</div>
    @endif

    @if ($this->tenant->subscription_status === \App\Models\Tenant::STATUS_PENDING_PAYMENT)
        <div class="alert alert-primary mb-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <span>{{ __('billing.pending_payment_notice') }}</span>
            <a href="{{ billing_checkout_url($this->tenant->plan?->slug, $this->tenant) }}" class="btn btn-primary text-nowrap">{{ __('billing.pending_payment_cta') }}</a>
        </div>
    @endif

    @if ($this->tenant->subscription_status === 'past_due' && $this->tenant->past_due_since)
        <div class="alert alert-warning mb-3">
            <strong>Pago pendiente.</strong> Actualiza tu método de pago para evitar la suspensión del servicio.
        </div>
    @endif

    <div class="row">
        <div class="col-md-6">
            <div class="card mb-4">
                <div class="card-header">Estado actual</div>
                <div class="card-body">
                    <dl class="row mb-0">
                        <dt class="col-sm-4">Plan</dt>
                        <dd class="col-sm-8">{{ $this->tenant->plan?->name ?? 'Sin plan' }}</dd>

                        <dt class="col-sm-4">Estado</dt>
                        <dd class="col-sm-8">
                            <span class="badge bg-{{ match($this->tenant->subscription_status) {
                                'active' => 'success',
                                'trial' => 'info',
                                'pending_payment' => 'primary',
                                'past_due' => 'warning',
                                'canceled', 'expired' => 'danger',
                                default => 'secondary'
                            } }}">
                                {{ $this->tenant->subscription_status }}
                            </span>
                        </dd>

                        <dt class="col-sm-4">Trial termina</dt>
                        <dd class="col-sm-8">{{ $this->tenant->trial_ends_at?->format('d/m/Y H:i') ?? '—' }}</dd>

                        <dt class="col-sm-4">Suscripción termina</dt>
                        <dd class="col-sm-8">{{ $this->tenant->subscription_ends_at?->format('d/m/Y H:i') ?? '—' }}</dd>

                        <dt class="col-sm-4">Región facturación</dt>
                        <dd class="col-sm-8">{{ $this->tenant->billing_region ?? '—' }}</dd>

                        <dt class="col-sm-4">Email facturación</dt>
                        <dd class="col-sm-8">{{ $this->tenant->billing_email ?? '—' }}</dd>

                        @if ($this->tenant->scheduledPlan)
                            <dt class="col-sm-4">Cambio programado</dt>
                            <dd class="col-sm-8">
                                Downgrade a <strong>{{ $this->tenant->scheduledPlan->name }}</strong> al final del período
                            </dd>
                        @endif
                    </dl>
                </div>
            </div>
        </div>

        <div class="col-md-6">
            <div class="card mb-4">
                <div class="card-header">Planes disponibles</div>
                <div class="card-body">
                    @error('plan')
                        <div class="alert alert-danger">{{ $message }}</div>
                    @enderror

                    @foreach ($this->plans as $plan)
                        <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                            <div>
                                <strong>{{ $plan->name }}</strong>
                                @if ($this->tenant->plan_id === $plan->id)
                                    <span class="badge bg-primary ms-1">Actual</span>
                                @endif
                                @if ($this->tenant->scheduled_plan_id === $plan->id)
                                    <span class="badge bg-info ms-1">Programado</span>
                                @endif
                            </div>
                            <div>
                                @php
                                    $currentPlan = $this->tenant->plan;
                                    $billingLocked = $this->tenant->isDemo() || $this->tenant->subscription_status === \App\Models\Tenant::STATUS_PENDING_PAYMENT;
                                    $canUpgrade = ! $billingLocked && $currentPlan && $plan->isHigherThan($currentPlan);
                                    $canDowngrade = ! $billingLocked && $currentPlan && ! $plan->isHigherThan($currentPlan) && $plan->id !== $currentPlan->id && empty($plan->exceedsLimits($this->tenant));
                                @endphp
                                @if ($canUpgrade)
                                    <button wire:click="upgrade('{{ $plan->slug }}')" class="btn btn-sm btn-success" wire:loading.attr="disabled">
                                        Upgrade
                                    </button>
                                @elseif ($canDowngrade)
                                    <button wire:click="downgrade('{{ $plan->slug }}')" class="btn btn-sm btn-outline-secondary" wire:loading.attr="disabled">
                                        Downgrade
                                    </button>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
