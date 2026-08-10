<div>

    {{-- ── TABLA ───────────────────────────────────────────── --}}
    <div class="shearly-table-wrap">
        <table class="w-full text-sm">
            <thead>
                <tr class="bg-brand-warm/60 border-b border-brand-blush-light/60">
                    <th scope="col" class="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted w-14">#</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">{{ __('app.dashboard.table_type') }}</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">{{ __('app.dashboard.table_client') }}</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">{{ __('app.dashboard.table_services') }}</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">Empleado</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">{{ __('app.dashboard.table_date') }}</th>
                    <th scope="col" class="px-3 py-4 text-left text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">{{ __('app.dashboard.table_status') }}</th>
                    <th scope="col" class="px-3 py-4 pr-5 text-right text-xs font-semibold uppercase tracking-wider text-brand-ink-muted">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-brand-blush-light/40">
                @forelse($appointments as $appointment)
                    <tr wire:key="{{ $appointment->id }}"
                        class="transition-colors duration-150 hover:bg-brand-rose-mist/50">

                        {{-- # --}}
                        <td class="px-5 py-4 text-xs text-brand-ink-muted/60 tabular-nums font-mono whitespace-nowrap">
                            {{ $appointment->id }}
                        </td>

                        {{-- Tipo --}}
                        <td class="px-3 py-4 whitespace-nowrap">
                            <span class="badge bg-{{ $appointment->type->bg_color }}">
                                {{ $appointment->type->name }}
                            </span>
                        </td>

                        {{-- Cliente --}}
                        <td class="px-3 py-4 font-medium text-brand-ink whitespace-nowrap">
                            {{ $appointment->name }}
                        </td>

                        {{-- Servicios — chips nombre + "+N" si hay más de 2 --}}
                        <td class="px-3 py-4">
                            @php
                                $visibleSvcs = $appointment->services->take(2);
                                $extraSvcs   = $appointment->services->count() - $visibleSvcs->count();
                            @endphp
                            <div class="flex items-center flex-wrap gap-1.5">
                                @foreach($visibleSvcs as $service)
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium
                                                 bg-brand-primary/10 text-brand-primary-dark
                                                 ring-1 ring-brand-primary/15
                                                 max-w-[160px] truncate whitespace-nowrap"
                                          title="{{ $service->item->name }}">
                                        {{ $service->item->name }}
                                    </span>
                                @endforeach
                                @if($extraSvcs > 0)
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold
                                                 bg-brand-blush-light/80 text-brand-ink-muted
                                                 ring-1 ring-brand-blush-light
                                                 whitespace-nowrap">
                                        +{{ $extraSvcs }}
                                    </span>
                                @endif
                            </div>
                        </td>

                        {{-- Empleado --}}
                        <td class="px-3 py-4 whitespace-nowrap">
                            @if($appointment->employee)
                                <div class="flex items-center gap-2">
                                    <div class="relative shrink-0">
                                        <img class="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                                             src="{{ asset($this->verySmall('storage/employees/', $appointment->employee->image)) }}"
                                             alt="{{ $appointment->employee->name }}"
                                             onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                                             loading="lazy">
                                        <span style="display:none"
                                              class="w-8 h-8 rounded-full ring-2 ring-white bg-brand-primary/15
                                                     items-center justify-center text-xs font-bold text-brand-primary-dark select-none">
                                            {{ mb_strtoupper(mb_substr($appointment->employee->name, 0, 1)) }}
                                        </span>
                                    </div>
                                    <span class="text-sm text-brand-ink">{{ $appointment->employee->name }}</span>
                                </div>
                            @else
                                <span class="text-xs text-brand-ink-muted/60 italic">Sin especificar</span>
                            @endif
                        </td>

                        {{-- Fecha --}}
                        <td class="px-3 py-4 text-sm text-brand-ink-muted whitespace-nowrap tabular-nums">
                            {{ \Carbon\Carbon::parse($appointment->start_time)->format('d-m-Y H:i') }}
                        </td>

                        {{-- Estado --}}
                        <td class="px-3 py-4 whitespace-nowrap">
                            <span class="badge bg-{{ $appointment->status->bg_color }}">
                                {{ $appointment->status->name }}
                            </span>
                        </td>

                        {{-- Acción --}}
                        <td class="px-3 py-4 pr-5 text-right">
                            @if($appointment->status_id != 1)
                                <button @click="$dispatch('delete-appointment', { id: {{ $appointment->id }} })"
                                        type="button"
                                        title="Cancelar agenda"
                                        class="inline-flex items-center justify-center p-2 rounded-lg
                                               text-brand-ink-muted cursor-pointer
                                               hover:text-red-500 hover:bg-red-50
                                               active:scale-95 transition-all duration-150">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"/>
                                    </svg>
                                </button>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="8" class="px-5 py-16 text-center">
                            <div class="flex flex-col items-center gap-3">
                                <span class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-primary/8 text-brand-ink-muted/40">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                                    </svg>
                                </span>
                                <p class="text-sm text-brand-ink-muted">
                                    Sin resultados
                                    @if($this->search)
                                        para <strong class="text-brand-ink">{{ $this->search }}</strong>
                                    @endif
                                </p>
                            </div>
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- ── PAGINACIÓN ──────────────────────────────────────── --}}
    {{ $appointments->links() }}

    {{-- ── CONFIRMACIÓN DE CANCELAR (Alpine — sin CoreUI) ──── --}}
    <div x-data="{ show: false, appointmentId: null, appointmentLabel: '' }"
         @delete-appointment.window="show = true; appointmentId = $event.detail.id; appointmentLabel = `N° ${$event.detail.id}`">

        <div x-show="show"
             x-cloak
             x-transition:enter="transition ease-out duration-200"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-150"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-50 flex items-center justify-center bg-brand-ink/40 backdrop-blur-sm"
             @keydown.escape.window="show = false">

            <div x-show="show"
                 x-transition:enter="transition ease-out duration-200"
                 x-transition:enter-start="opacity-0 scale-95 translate-y-1"
                 x-transition:enter-end="opacity-100 scale-100 translate-y-0"
                 x-transition:leave="transition ease-in duration-150"
                 x-transition:leave-start="opacity-100 scale-100"
                 x-transition:leave-end="opacity-0 scale-95"
                 class="w-full max-w-sm mx-4 rounded-2xl bg-white border border-brand-blush-light/80 shadow-2xl shadow-brand-ink/10 overflow-hidden"
                 @click.stop>

                {{-- Icono + mensaje --}}
                <div class="px-6 pt-6 pb-4 flex gap-4">
                    <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50 text-red-500 shrink-0">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"/>
                        </svg>
                    </span>
                    <div class="min-w-0">
                        <p class="font-semibold text-brand-ink text-sm leading-snug">Cancelar agenda</p>
                        <p class="mt-1 text-xs text-brand-ink-muted leading-relaxed"
                           x-text="`¿Confirmas que quieres cancelar la agenda ${appointmentLabel}? Esta acción no se puede deshacer.`">
                        </p>
                    </div>
                </div>

                {{-- Acciones --}}
                <div class="flex items-center justify-end gap-2 px-6 py-4 bg-brand-warm/50 border-t border-brand-blush-light/60">
                    <button type="button"
                            @click="show = false"
                            class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-brand-ink-muted
                                   border border-brand-blush-light bg-white hover:bg-brand-warm transition-colors">
                        Cerrar
                    </button>
                    <button type="button"
                            x-on:click="$wire.cancel(appointmentId); show = false"
                            class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold
                                   bg-red-500 text-white hover:bg-red-600 transition-colors shadow-sm">
                        Cancelar agenda
                    </button>
                </div>

            </div>
        </div>
    </div>

</div>
