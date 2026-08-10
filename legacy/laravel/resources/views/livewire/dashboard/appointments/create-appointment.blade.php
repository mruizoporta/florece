<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    {{-- ── FORMULARIO PRINCIPAL (2 cols) ──────────────────── --}}
    <div class="lg:col-span-2">
        <div class="shearly-card-section">

            <div class="shearly-card-head">
                <h2 class="shearly-card-title">Datos de la cita</h2>
            </div>

            <div class="px-5 py-5 md:px-6 space-y-4">

                {{-- Nombre --}}
                <div>
                    <label class="shearly-label">Nombre</label>
                    <input type="text"
                           wire:model="form.name"
                           class="shearly-input @error('form.name') is-invalid @enderror"
                           placeholder="Nombre del cliente">
                    @error('form.name')<p class="shearly-error">{{ $message }}</p>@enderror
                </div>

                {{-- Teléfono --}}
                <div>
                    <label class="shearly-label">Teléfono</label>
                    <input type="number"
                           wire:model="form.phone"
                           class="shearly-input @error('form.phone') is-invalid @enderror"
                           placeholder="Teléfono">
                    @error('form.phone')<p class="shearly-error">{{ $message }}</p>@enderror
                </div>

                {{-- Empleado --}}
                <div>
                    <label class="shearly-label">Empleado</label>
                    <select wire:model.blur="form.employee_id"
                            wire:change="changeEmployee"
                            class="shearly-select @error('form.employee_id') is-invalid @enderror"
                            aria-label="Seleccione empleado">
                        <option value="">Seleccione...</option>
                        @foreach($employees as $item)
                            <option value="{{ $item->id }}">{{ $item->name }}</option>
                        @endforeach
                    </select>
                    @error('form.employee_id')<p class="shearly-error">{{ $message }}</p>@enderror
                </div>

                {{-- Fecha --}}
                <div>
                    <label class="shearly-label">Fecha</label>
                    <input type="date"
                           id="dateAppointment"
                           wire:model="form.date"
                           wire:change="changeDate"
                           class="shearly-input @error('form.date') is-invalid @enderror">
                    @error('form.date')<p class="shearly-error">{{ $message }}</p>@enderror
                </div>

                {{-- Horario --}}
                <div>
                    <label class="shearly-label">Horario</label>
                    <select wire:model.blur="form.time"
                            class="shearly-select @error('form.time') is-invalid @enderror"
                            aria-label="Seleccione horario">
                        <option value="">Seleccione...</option>
                        @foreach($availableSchedules as $item)
                            <option value="{{ $item['start'] }}">{{ $item['start'] }}</option>
                        @endforeach
                    </select>
                    @error('form.time')<p class="shearly-error">{{ $message }}</p>@enderror
                </div>

                {{-- Acción --}}
                <div class="flex justify-end pt-2">
                    <button wire:click="save"
                            type="button"
                            class="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-primary-dark shadow-sm shadow-brand-primary/30 transition-all hover:bg-brand-primary-hover hover:shadow-md hover:-translate-y-px">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                        </svg>
                        Ingresar
                    </button>
                </div>

            </div>
        </div>
    </div>

    {{-- ── SERVICIOS (1 col) ───────────────────────────────── --}}
    <div>
        <div class="shearly-card-section h-full">

            <div class="shearly-card-head">
                <h2 class="shearly-card-title">Servicios</h2>
                @if($durationTime > 0)
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                                 bg-brand-primary/15 text-brand-primary-dark border border-brand-primary/20">
                        {{ $durationTime }} min
                    </span>
                @endif
            </div>

            {{-- Tabla --}}
            <div class="overflow-y-auto" style="max-height: 420px;">
                <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-brand-warm/80 border-b border-brand-blush-light/60">
                        <tr>
                            <th class="w-10 px-4 py-3"></th>
                            <th class="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-brand-ink-muted">
                                Servicio
                            </th>
                            <th class="px-3 py-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-brand-ink-muted">
                                Duración
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-brand-blush-light/40">
                        @forelse($services as $service)
                            <tr wire:key="{{ $service->id }}"
                                class="transition-colors hover:bg-brand-rose-mist/50">

                                {{-- Checkbox --}}
                                <td class="px-4 py-3">
                                    <input wire:model="form.services"
                                           wire:click="toggleService"
                                           class="shearly-checkbox"
                                           type="checkbox"
                                           value="{{ $service->id }}"
                                           id="flexCheckServiceId{{ $service->id }}">
                                </td>

                                {{-- Imagen + nombre --}}
                                <td class="px-3 py-3">
                                    <label for="flexCheckServiceId{{ $service->id }}"
                                           class="flex items-center gap-2.5 cursor-pointer select-none">
                                        <div class="relative shrink-0">
                                            <img class="w-8 h-8 rounded-lg object-cover border border-brand-blush-light/60"
                                                 src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}"
                                                 alt="{{ $service->item->name }}"
                                                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
                                                 loading="lazy">
                                            <span style="display:none"
                                                  class="w-8 h-8 rounded-lg bg-brand-primary/10 border border-brand-primary/20
                                                         items-center justify-center text-[10px] font-semibold text-brand-primary-dark select-none">
                                                {{ mb_strtoupper(mb_substr($service->item->name, 0, 1)) }}
                                            </span>
                                        </div>
                                        <span class="text-sm text-brand-ink">{{ $service->item->name }}</span>
                                    </label>
                                </td>

                                {{-- Duración --}}
                                <td class="px-3 py-3 pr-4 text-right">
                                    <span class="text-xs tabular-nums text-brand-ink-muted font-medium whitespace-nowrap">
                                        {{ $service->duration_time }} min
                                    </span>
                                </td>

                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" class="px-4 py-10 text-center">
                                    <p class="text-sm text-brand-ink-muted">Sin servicios disponibles</p>
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            @error('form.services')
                <div class="px-4 py-3 border-t border-brand-blush-light/60">
                    <p class="shearly-error">Seleccione al menos un servicio</p>
                </div>
            @enderror

        </div>
    </div>

</div>

@push('js')
    <script>
        var currentDate = new Date().toISOString().split('T')[0];
        document.getElementById('dateAppointment').setAttribute('min', currentDate);
    </script>
@endpush
