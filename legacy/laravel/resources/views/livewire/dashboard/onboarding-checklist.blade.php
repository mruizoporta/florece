<div>
@php
    $items = [
        ['done' => $this->hasServices, 'label' => 'Agrega tus servicios', 'href' => tenant_url('/dashboard/items/create'), 'icon' => 'cil-notes'],
        ['done' => $this->hasEmployees, 'label' => 'Agrega tus empleados', 'href' => tenant_url('/dashboard/employees/create'), 'icon' => 'cil-user'],
        ['done' => $this->hasAppointments, 'label' => 'Crea tu primera cita', 'href' => tenant_url('/dashboard/appointments/create'), 'icon' => 'cil-calendar'],
    ];
    $doneCount = collect($items)->filter(fn ($i) => $i['done'])->count();
@endphp

@if (!$this->isComplete)
    <div class="shearly-card-section shearly-onboarding-card">
        <div class="px-4 py-6 sm:px-6 lg:px-8">
            <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex items-center gap-3">
                    <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shearly-onboarding-icon">
                        <svg class="icon icon-lg">
                            <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-check-alt') }}"></use>
                        </svg>
                    </div>
                    <div>
                        <h6 class="mb-0 text-base font-semibold text-brand-text">Configura tu salón</h6>
                        <p class="mb-0 text-sm text-brand-textMuted">{{ $doneCount }}/3 completados - completa los pasos para empezar</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 shearly-onboarding-actions">
                    @foreach ($items as $item)
                        @if ($item['done'])
                            <span class="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white px-3 py-2 text-sm font-medium text-emerald-700">
                                <svg class="icon"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-check-circle') }}"></use></svg>
                                {{ $item['label'] }}
                            </span>
                        @else
                            <a href="{{ $item['href'] }}" wire:navigate
                                class="shearly-onboarding-link inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm font-medium text-brand-text no-underline">
                                <svg class="icon"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#' . $item['icon']) }}"></use></svg>
                                {{ $item['label'] }}
                                <svg class="icon icon-sm"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-arrow-right') }}"></use></svg>
                            </a>
                        @endif
                    @endforeach
                </div>
            </div>
        </div>
    </div>
@endif
</div>
