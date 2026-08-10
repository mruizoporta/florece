@php
    $boardRibbon = fn (?string $k) => match ($k) {
        'danger' => 'bg-red-500 text-white',
        'warning' => 'bg-amber-500 text-white',
        'success' => 'bg-emerald-500 text-white',
        'info' => 'bg-sky-500 text-white',
        'primary' => 'bg-brand-primary text-brand-primary-dark',
        default => 'bg-brand-ink/75 text-white',
    };
    $boardStatusBtn = fn (?string $k) => match ($k) {
        'danger' => 'border-red-200/90 bg-red-50/80 text-red-800 hover:bg-red-50',
        'warning' => 'border-amber-200/90 bg-amber-50/90 text-amber-900 hover:bg-amber-50',
        'success' => 'border-emerald-200/90 bg-emerald-50/90 text-emerald-900 hover:bg-emerald-50',
        'info' => 'border-sky-200/90 bg-sky-50/90 text-sky-900 hover:bg-sky-50',
        'primary' => 'border-brand-primary/35 bg-brand-primary/12 text-brand-primary-dark hover:bg-brand-primary/18',
        default => 'border-brand-blush-light bg-white text-brand-ink hover:bg-brand-warm',
    };
@endphp

<div>
    <div class="flex justify-end mb-4">
        <button type="button"
                onclick="window.dispatchEvent(new CustomEvent('open-simple-appointment'))"
                class="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-3.5 py-2 text-sm font-semibold text-brand-primary-dark shadow-sm shadow-brand-primary/25 transition-all hover:bg-brand-primary-hover hover:shadow-md">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            Cita rápida
        </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        @forelse($appointments as $appointment)
            <div wire:key="appt-card-{{ $appointment->id }}"
                 x-data="{ ddEmp: false, ddSt: false, ddAdd: false }"
                 @click.outside="ddEmp = false; ddSt = false; ddAdd = false"
                 class="relative rounded-2xl border border-brand-blush-light/80 bg-white shadow-sm overflow-hidden flex flex-col">

                <div class="absolute right-0 top-0 z-10 rounded-bl-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide {{ $boardRibbon($appointment->type->bg_color ?? null) }}">
                    {{ $appointment->type->name }}
                </div>

                <div class="pt-8 px-4 pb-3 flex flex-col flex-1">
                    <div class="flex items-start justify-center gap-2 text-center">
                        <svg class="w-4 h-4 text-brand-ink-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                        </svg>
                        <p class="text-xs font-semibold uppercase tracking-wide text-brand-ink-muted leading-snug">{{ $appointment->name }}</p>
                    </div>

                    <div class="text-center py-3">
                        <div class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink">
                            <svg class="w-4 h-4 text-brand-ink-muted" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                            </svg>
                            {{ \Carbon\Carbon::parse($appointment->start_time)->format('H:i') }}
                        </div>
                        @can('reschedule', $appointment)
                            <div class="mt-2">
                                <button type="button"
                                        wire:click="openReschedule({{ $appointment->id }})"
                                        class="text-xs font-medium text-brand-primary-dark underline-offset-2 hover:underline">
                                    Reprogramar
                                </button>
                            </div>
                        @endcan
                    </div>

                    <div class="flex flex-col items-center gap-3">
                        <div class="flex flex-wrap items-center justify-center gap-2">
                            {{-- Empleado --}}
                            @if (in_array($appointment->status_id, [1, 2, 3]))
                                <div class="relative">
                                    <button type="button"
                                            @click="ddEmp = !ddEmp; ddSt = false; ddAdd = false"
                                            class="relative flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-brand-blush-light/60 bg-brand-warm overflow-hidden shrink-0 hover:ring-brand-primary/40 transition-all"
                                            title="Asignar empleado">
                                        @if ($appointment->employee)
                                            <img class="h-full w-full object-cover"
                                                 src="{{ asset($this->verySmall('storage/employees/', $appointment->employee->image)) }}"
                                                 alt="{{ $appointment->employee->name }}"
                                                 loading="lazy">
                                        @else
                                            <span class="text-lg font-bold text-brand-ink-muted">?</span>
                                        @endif
                                    </button>
                                    <div x-show="ddEmp"
                                         x-cloak
                                         x-transition
                                         class="absolute left-1/2 z-30 mt-2 w-56 -translate-x-1/2 rounded-xl border border-brand-blush-light/80 bg-white py-1 shadow-lg max-h-60 overflow-y-auto">
                                        @foreach ($employees as $employee)
                                            <button type="button"
                                                    wire:key="emp-opt-{{ $appointment->id }}-{{ $employee->id }}"
                                                    wire:click="changeEmployee({{ $appointment->id }}, {{ $employee->id }})"
                                                    @click="ddEmp = false"
                                                    @disabled($appointment->employee_id == $employee->id)
                                                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink hover:bg-brand-warm disabled:opacity-40 disabled:pointer-events-none">
                                                <img class="h-8 w-8 rounded-full object-cover ring-1 ring-brand-blush-light/60"
                                                     src="{{ asset($this->small('storage/employees/', $employee->image)) }}"
                                                     alt="" loading="lazy">
                                                <span class="flex-1 truncate">{{ $employee->name }}</span>
                                                @if ($employee->id == $appointment->employee_id)
                                                    <svg class="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                                                    </svg>
                                                @endif
                                            </button>
                                        @endforeach
                                    </div>
                                </div>
                            @else
                                <div class="flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-brand-blush-light/40 bg-brand-warm overflow-hidden">
                                    @if ($appointment->employee)
                                        <img class="h-full w-full object-cover"
                                             src="{{ asset($this->verySmall('storage/employees/', $appointment->employee->image)) }}"
                                             alt="" loading="lazy">
                                    @else
                                        <span class="text-sm text-brand-ink-muted">—</span>
                                    @endif
                                </div>
                            @endif

                            {{-- Estado --}}
                            <div class="relative">
                                <button type="button"
                                        @click="ddSt = !ddSt; ddEmp = false; ddAdd = false"
                                        class="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold {{ $boardStatusBtn($appointment->status->bg_color ?? null) }} transition-colors">
                                    {{ $appointment->status->name }}
                                    <svg class="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                                    </svg>
                                </button>
                                <div x-show="ddSt"
                                     x-cloak
                                     x-transition
                                     class="absolute left-1/2 z-30 mt-2 w-56 -translate-x-1/2 rounded-xl border border-brand-blush-light/80 bg-white py-1 shadow-lg">
                                    @switch($appointment->status_id)
                                        @case(1)
                                            <span class="block px-3 py-2 text-xs text-brand-ink-muted">Ocultar (próximamente)</span>
                                            @break
                                        @case(2)
                                            <button type="button"
                                                    wire:click="confirmAssistance({{ $appointment->id }})"
                                                    @click="ddSt = false"
                                                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink hover:bg-brand-warm">
                                                <span class="text-emerald-600">✓</span> Confirmar asistencia
                                            </button>
                                            <div class="my-1 border-t border-brand-blush-light/60"></div>
                                            <button type="button"
                                                    wire:click="cancelAppointment({{ $appointment->id }})"
                                                    @click="ddSt = false"
                                                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                                Cancelar agenda
                                            </button>
                                            @break
                                        @case(3)
                                            @if ($appointment->employee)
                                                <button type="button"
                                                        wire:click="attendCustomer({{ $appointment->id }}, {{ $appointment->employee_id }}, @js($appointment->employee->name))"
                                                        @click="ddSt = false"
                                                        class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-ink hover:bg-brand-warm">
                                                    Atender con {{ $appointment->employee->name }}
                                                </button>
                                            @endif
                                            <div class="my-1 border-t border-brand-blush-light/60"></div>
                                            <button type="button"
                                                    wire:click="cancelAppointment({{ $appointment->id }})"
                                                    @click="ddSt = false"
                                                    class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                                                Cancelar agenda
                                            </button>
                                            @break
                                        @case(4)
                                            <span class="block px-3 py-2 text-xs text-brand-ink-muted">Finalizar consulta (próximamente)</span>
                                            @break
                                        @default
                                    @endswitch
                                </div>
                            </div>
                        </div>

                        <div class="w-full border-t border-brand-blush-light/50 pt-3">
                            <p class="text-[10px] font-semibold uppercase tracking-wide text-brand-ink-muted text-center mb-2">Servicios</p>
                            <div class="service-container flex flex-wrap items-center justify-center gap-2 min-h-[2.5rem]">
                                @foreach ($appointment->services as $service)
                                    <div wire:key="svc-{{ $service->id }}" class="relative group">
                                        <img class="h-10 w-10 rounded-lg object-cover ring-1 ring-brand-blush-light/70"
                                             src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}"
                                             title="{{ $service->item->name }}"
                                             alt=""
                                             loading="lazy">
                                        <button type="button"
                                                wire:click="deleteService({{ $appointment->id }}, {{ $service->id }})"
                                                title="Quitar {{ $service->item->name }}"
                                                class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow">
                                            ×
                                        </button>
                                    </div>
                                @endforeach

                                <div class="relative">
                                    <button type="button"
                                            @click="ddAdd = !ddAdd; ddEmp = false; ddSt = false"
                                            class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-brand-primary/40 text-brand-primary-dark hover:bg-brand-primary/10 transition-colors"
                                            title="Añadir servicio">
                                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                        </svg>
                                    </button>
                                    <div x-show="ddAdd"
                                         x-cloak
                                         x-transition
                                         class="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-brand-blush-light/80 bg-white py-1 shadow-lg max-h-52 overflow-y-auto">
                                        @foreach ($services as $service)
                                            <button type="button"
                                                    wire:key="add-svc-{{ $appointment->id }}-{{ $service->id }}"
                                                    wire:click="addService({{ $appointment->id }}, {{ $service->id }})"
                                                    @click="ddAdd = false"
                                                    class="w-full text-left px-3 py-2 text-sm text-brand-ink hover:bg-brand-warm truncate">
                                                {{ $service->item->name }}
                                            </button>
                                        @endforeach
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @empty
            <div class="col-span-full rounded-2xl border border-dashed border-brand-blush-light/80 bg-brand-warm/25 px-6 py-14 text-center">
                <p class="text-sm text-brand-ink-muted">Sin resultados.</p>
            </div>
        @endforelse
    </div>

    @if ($rescheduleAppointmentId)
        <div class="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-brand-ink/45 backdrop-blur-sm" wire:click="closeReschedule"></div>
            <div class="relative w-full max-w-md rounded-2xl bg-brand-base border border-brand-blush-light/80 shadow-2xl overflow-hidden"
                 @click.stop>
                <div class="px-6 pt-5 pb-4 border-b border-brand-blush-light/60 flex items-center justify-between">
                    <h2 class="font-serif text-lg font-semibold text-brand-ink">Reprogramar cita</h2>
                    <button type="button" wire:click="closeReschedule" class="p-1.5 rounded-lg text-brand-ink-muted hover:bg-brand-warm" aria-label="Cerrar">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <form wire:submit.prevent="submitReschedule">
                    <div class="px-6 py-5 space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wide text-brand-ink-muted mb-1.5">Empleado</label>
                            <select wire:model="rescheduleEmployeeId" required
                                    class="w-full rounded-xl border border-brand-blush-light bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15">
                                <option value="">—</option>
                                @foreach ($employees as $employee)
                                    <option value="{{ $employee->id }}">{{ $employee->name }}</option>
                                @endforeach
                            </select>
                            @error('rescheduleEmployeeId') <p class="mt-1 text-xs text-red-600">{{ $message }}</p> @enderror
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wide text-brand-ink-muted mb-1.5">Fecha</label>
                            <input type="date" wire:model="rescheduleDate" required
                                   class="w-full rounded-xl border border-brand-blush-light bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15" />
                            @error('rescheduleDate') <p class="mt-1 text-xs text-red-600">{{ $message }}</p> @enderror
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wide text-brand-ink-muted mb-1.5">Hora inicio</label>
                            <input type="time" wire:model="rescheduleTime" required
                                   class="w-full rounded-xl border border-brand-blush-light bg-white px-3 py-2.5 text-sm text-brand-ink focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15" />
                            @error('rescheduleTime') <p class="mt-1 text-xs text-red-600">{{ $message }}</p> @enderror
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 px-6 py-4 bg-brand-warm/40 border-t border-brand-blush-light/60">
                        <button type="button" wire:click="closeReschedule"
                                class="px-4 py-2.5 rounded-xl text-sm font-medium text-brand-ink-muted border border-brand-blush-light bg-white hover:bg-brand-warm">
                            Cerrar
                        </button>
                        <button type="submit"
                                class="px-4 py-2.5 rounded-xl text-sm font-semibold bg-brand-primary text-brand-primary-dark shadow-sm hover:bg-brand-primary-hover">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    @endif
</div>
