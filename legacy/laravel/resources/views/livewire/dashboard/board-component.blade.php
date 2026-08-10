<div>

    <livewire:dashboard.orders.list-orders-in-backdrop lazy />

    <livewire:dashboard.appointments.create-simple-appointment />

    @section('pageTitle', __('app.page.title.board'))

    @section('breadcrumbs')
        <a href="{{ tenant_route('dashboard') }}" wire:navigate class="hover:text-brand-ink transition-colors">
            {{ __('app.nav.dashboard') }}
        </a>
        <span class="text-brand-blush">/</span>
        <span class="text-brand-ink font-medium">{{ __('app.page.title.board') }}</span>
    @endsection

    @section('topbarActions')
        <button type="button"
                onclick="window.dispatchEvent(new CustomEvent('open-board-tickets'))"
                class="relative inline-flex items-center gap-2 rounded-xl border border-brand-blush-light/90 bg-white px-3 py-2 text-sm font-medium text-brand-ink shadow-sm hover:bg-brand-warm transition-colors">
            <svg class="w-4 h-4 text-brand-ink-muted" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
            </svg>
            Tickets
            <livewire:dashboard.orders.notify-icon />
        </button>
    @endsection

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {{-- Lista de espera --}}
        <div class="shearly-card-section flex flex-col min-h-[min(70vh,560px)] lg:min-h-[560px]">
            <div class="shearly-card-head bg-brand-warm/30 shrink-0">
                <div class="min-w-0">
                    <h2 class="shearly-card-title mb-0">Lista de espera</h2>
                    <p class="mt-1 text-xs text-brand-ink-muted leading-snug">Citas de hoy en espera y en sala. Cita rápida sin servicios previos.</p>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 border-t border-brand-blush-light/40">
                <livewire:dashboard.appointments.list-appointments-cards lazy />
            </div>
        </div>

        {{-- Empleados en atención --}}
        <div class="shearly-card-section flex flex-col min-h-[min(70vh,560px)] lg:min-h-[560px]">
            <div class="shearly-card-head bg-brand-warm/30 shrink-0">
                <div class="min-w-0">
                    <h2 class="shearly-card-title mb-0">Empleados</h2>
                    <p class="mt-1 text-xs text-brand-ink-muted leading-snug">Estado de atención y temporizador por empleado.</p>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-4 md:p-5 border-t border-brand-blush-light/40">
                <livewire:dashboard.board.employee-component lazy />
            </div>
        </div>
    </div>

</div>
