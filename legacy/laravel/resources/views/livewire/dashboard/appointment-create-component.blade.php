<div>

    @section('pageTitle', __('app.page.title.appointment_new'))

    @section('breadcrumbs')
        <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="hover:text-brand-ink transition-colors">
            {{ __('app.nav.dashboard') }}
        </a>
        <span class="text-brand-blush">/</span>
        <a href="{{ tenant_url('/dashboard/appointments') }}" wire:navigate class="hover:text-brand-ink transition-colors">
            {{ __('app.page.title.appointments') }}
        </a>
        <span class="text-brand-blush">/</span>
        <span class="text-brand-ink font-medium">Nueva cita</span>
    @endsection

    <livewire:dashboard.appointments.create-appointment />

</div>
