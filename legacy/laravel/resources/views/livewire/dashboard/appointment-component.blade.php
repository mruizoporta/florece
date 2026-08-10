<div>

    @section('pageTitle', __('app.page.title.appointments'))

    @section('breadcrumbs')
        <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="hover:text-brand-ink transition-colors">
            {{ __('app.nav.dashboard') }}
        </a>
        <span class="text-brand-blush">/</span>
        <span class="text-brand-ink font-medium">{{ __('app.page.title.appointments') }}</span>
    @endsection

    <div class="shearly-card-section">

        {{-- Header de card --}}
        <div class="shearly-card-head bg-brand-warm/30">
            <div class="min-w-0">
                <div class="flex items-center gap-2.5">
                    <h2 class="shearly-card-title mb-0">{{ __('app.dashboard.section_latest_appointments') }}</h2>
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-brand-primary/15 text-brand-primary-dark border border-brand-primary/20">
                        PRO
                    </span>
                </div>
                <p class="mt-1 text-xs text-brand-ink-muted leading-none">Gestiona y consulta todas las citas del salón</p>
            </div>
            <a href="{{ tenant_url('/dashboard/appointments/create') }}" wire:navigate
               class="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-dark shadow-sm shadow-brand-primary/30 transition-all hover:bg-brand-primary-hover hover:shadow-md hover:-translate-y-px shrink-0">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                Nueva cita
            </a>
        </div>

        {{-- Barra de búsqueda --}}
        <div class="px-5 pt-4 pb-3 md:px-6 border-b border-brand-blush-light/60">
            <livewire:dashboard.search-component lazy />
        </div>

        {{-- Tabla --}}
        <livewire:dashboard.appointments.list-appointments />

    </div>

</div>
