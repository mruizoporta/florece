<div class="shearly-dashboard-home">

    {{-- Shell estable: las métricas y citas van primero (orden + min-height reduce saltos) --}}
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 shearly-kpi-grid shearly-dashboard-kpi-shell">
        <div class="shearly-kpi-card flex h-full min-h-[6.75rem] flex-col p-4">
            <div class="flex min-h-[5rem] flex-1 items-center gap-3">
                <div class="shearly-kpi-icon">
                    <svg class="icon icon-lg opacity-90">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-notes') }}"></use>
                    </svg>
                </div>
                <div class="min-w-0 flex-1 shearly-kpi-metric min-h-[3.5rem]">
                    <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-textMuted" style="letter-spacing: .06em;">{{ __('app.dashboard.kpi_today') }}</div>
                    <livewire:dashboard.widgets.appointments-for-today />
                </div>
            </div>
        </div>
        <div class="shearly-kpi-card flex h-full min-h-[6.75rem] flex-col p-4">
            <div class="flex min-h-[5rem] flex-1 items-center gap-3">
                <div class="shearly-kpi-icon">
                    <svg class="icon icon-lg opacity-90">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-calculator') }}"></use>
                    </svg>
                </div>
                <div class="min-w-0 flex-1 shearly-kpi-metric min-h-[3.5rem]">
                    <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-textMuted" style="letter-spacing: .06em;">{{ __('app.dashboard.kpi_pending_tickets') }}</div>
                    <livewire:dashboard.widgets.tickets-pending-counter />
                </div>
            </div>
        </div>
        <div class="shearly-kpi-card flex h-full min-h-[6.75rem] flex-col p-4">
            <div class="flex min-h-[5rem] flex-1 items-center gap-3">
                <div class="shearly-kpi-icon">
                    <svg class="icon icon-lg opacity-90">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-dollar') }}"></use>
                    </svg>
                </div>
                <div class="min-w-0 flex-1 shearly-kpi-metric min-h-[3.5rem]">
                    <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-textMuted" style="letter-spacing: .06em;">{{ __('app.dashboard.kpi_income') }}</div>
                    <livewire:dashboard.widgets.total-income />
                </div>
            </div>
        </div>
        <div class="shearly-kpi-card flex h-full min-h-[6.75rem] flex-col p-4">
            <div class="flex min-h-[5rem] flex-1 items-center gap-3">
                <div class="shearly-kpi-icon">
                    <svg class="icon icon-lg opacity-90">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-people') }}"></use>
                    </svg>
                </div>
                <div class="min-w-0 flex-1 shearly-kpi-metric min-h-[3.5rem]">
                    <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-textMuted" style="letter-spacing: .06em;">{{ __('app.dashboard.kpi_waiting') }}</div>
                    <livewire:dashboard.widgets.waiting-customers-counter />
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="shearly-dashboard-slot-appointments lg:col-span-8 min-h-[20rem]">
            <div class="shearly-card-section mb-4">
                <div class="shearly-card-head">
                    <h2 class="shearly-card-title mb-0">{{ __('app.dashboard.section_latest_appointments') }}</h2>
                    <a href="{{ tenant_url('/dashboard/appointments') }}" wire:navigate
                       class="inline-flex items-center gap-1.5 rounded-xl border border-brand-blush-light px-3 py-1.5 text-xs font-semibold text-brand-ink-muted transition hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-ink">
                        {{ __('app.dashboard.link_view_all_appointments') }}
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
                        </svg>
                    </a>
                </div>
                <div class="shearly-table-wrap min-h-[19rem] px-2 pb-3">
                    <livewire:dashboard.widgets.latest-appointments />
                </div>
            </div>
        </div>

        <div class="shearly-dashboard-slot-chart lg:col-span-4 min-h-[16rem]">
            <div class="shearly-card-section mb-4">
                <div class="shearly-card-head">
                    <h2 class="shearly-card-title mb-0">{{ __('app.dashboard.section_appointment_types') }}</h2>
                </div>
                <div class="shearly-chart-shell flex min-h-[240px] flex-col px-5 pb-5 pt-3 md:px-6">
                    <div class="min-h-[200px] flex-1">
                        <livewire:dashboard.widgets.type-of-appointments-chart lazy />
                    </div>
                    <p class="mt-3 shrink-0 text-sm text-brand-textMuted">Vista de distribución por tipo de cita.</p>
                </div>
            </div>
        </div>
    </div>

    <div class="shearly-dashboard-slot-tops grid grid-cols-1 gap-4 min-h-[17rem] lg:grid-cols-2">
        <div class="min-h-[16rem]">
            <div class="shearly-card-section mb-4">
                <div class="shearly-card-head">
                    <h2 class="shearly-card-title mb-0">{{ __('app.dashboard.section_top_services') }}</h2>
                </div>
                <div class="min-h-[17rem]">
                    <livewire:dashboard.widgets.top-services-sold-table lazy />
                </div>
            </div>
        </div>

        <div class="min-h-[16rem]">
            <div class="shearly-card-section mb-4">
                <div class="shearly-card-head">
                    <h2 class="shearly-card-title mb-0">{{ __('app.dashboard.section_top_products') }}</h2>
                </div>
                <div class="min-h-[17rem]">
                    <livewire:dashboard.widgets.top-products-sold-table lazy />
                </div>
            </div>
        </div>
    </div>
</div>
