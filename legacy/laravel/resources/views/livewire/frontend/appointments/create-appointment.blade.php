@php
    $steps = [
        1 => __('app.booking.step_employee'),
        2 => __('app.booking.step_services'),
        3 => __('app.booking.step_schedule'),
        4 => __('app.booking.summary_heading'),
    ];
    $selectedEmployeeId = $form->employeeId;
    $selectedServiceIds = array_map('intval', (array) $form->services);
@endphp

<div class="space-y-8">
    {{-- Stepper --}}
    <nav aria-label="{{ __('app.salon.book') }}">
        <ol class="grid grid-cols-4 gap-2 sm:gap-3">
            @foreach ($steps as $n => $label)
                @php
                    $done = $step > $n;
                    $current = $step === $n;
                @endphp
                <li class="flex flex-col items-center text-center">
                    <span @class([
                        'flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ring-2',
                        'bg-brand-primary text-brand-primary-dark ring-brand-primary/40 shadow-sm shadow-brand-primary/30' => $current,
                        'bg-brand-primary/20 text-brand-primary-dark ring-brand-primary/20' => $done,
                        'bg-white text-brand-ink-muted ring-brand-blush-light' => ! $current && ! $done,
                    ])>
                        @if ($done)
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        @else
                            {{ $n }}
                        @endif
                    </span>
                    <span @class([
                        'mt-2 text-[11px] sm:text-xs font-medium leading-tight',
                        'text-brand-ink' => $current || $done,
                        'text-brand-ink-muted' => ! $current && ! $done,
                    ])>{{ $label }}</span>
                </li>
            @endforeach
        </ol>
        <div class="mt-4 h-1 rounded-full bg-brand-blush-light/80 overflow-hidden" aria-hidden="true">
            <div class="h-full rounded-full bg-brand-primary transition-all duration-300" style="width: {{ ($step / 4) * 100 }}%"></div>
        </div>
    </nav>

    <div class="rounded-2xl border border-brand-blush-light/80 bg-white/85 backdrop-blur-sm p-6 sm:p-8 shadow-[0_12px_48px_-24px_rgba(29,31,36,0.14)]">
        @switch($step)
            @case(1)
                <h2 class="font-serif text-2xl sm:text-3xl font-semibold text-brand-ink text-center mb-8">
                    {{ __('app.booking.choose_employee') }}
                </h2>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    @forelse($employees as $employee)
                        <button type="button"
                            wire:key="employee-{{ $employee->id }}"
                            wire:click="selectEmployee({{ $employee->id }})"
                            @class([
                                'group flex items-center gap-4 rounded-2xl border p-4 text-left transition',
                                'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/35 shadow-sm shadow-brand-primary/15' => (int) $selectedEmployeeId === (int) $employee->id,
                                'border-brand-blush-light/90 bg-brand-base/40 hover:border-brand-primary/50 hover:bg-brand-warm/60' => (int) $selectedEmployeeId !== (int) $employee->id,
                            ])>
                            <img
                                src="{{ asset($this->small('storage/employees/', $employee->image)) }}"
                                alt="{{ $employee->name }}"
                                class="h-16 w-16 rounded-full object-cover bg-brand-mist ring-2 ring-white shadow-sm shrink-0"
                            >
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-brand-ink truncate">{{ $employee->name }}</p>
                                @if(filled($employee->description))
                                    <p class="text-sm text-brand-ink-muted line-clamp-2 mt-0.5">{{ $employee->description }}</p>
                                @endif
                            </div>
                            @if((int) $selectedEmployeeId === (int) $employee->id)
                                <span class="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-brand-primary-dark">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                                </span>
                            @endif
                        </button>
                    @empty
                        <p class="sm:col-span-2 text-center text-brand-ink-muted py-8">{{ __('app.booking.no_results') }}</p>
                    @endforelse
                </div>

                @error('form.employeeId')
                    <p class="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3">
                        {{ __('app.booking.select_employee_error') }}
                    </p>
                @enderror
            @break

            @case(2)
                <h2 class="font-serif text-2xl sm:text-3xl font-semibold text-brand-ink text-center mb-2">
                    {{ __('app.booking.choose_services') }}
                </h2>
                @if($form->durationTime)
                    <p class="text-center text-sm text-brand-ink-muted mb-8">
                        {{ __('app.booking.duration_total', ['minutes' => $form->durationTime]) }}
                    </p>
                @else
                    <div class="mb-8"></div>
                @endif

                <div class="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                    @forelse($services as $service)
                        @php $checked = in_array((int) $service->id, $selectedServiceIds, true); @endphp
                        <label
                            wire:key="service-{{ $service->id }}"
                            for="book-service-{{ $service->id }}"
                            @class([
                                'flex items-center gap-4 rounded-2xl border p-4 cursor-pointer transition',
                                'border-brand-primary bg-brand-primary/10 ring-2 ring-brand-primary/30' => $checked,
                                'border-brand-blush-light/90 bg-brand-base/40 hover:border-brand-primary/40' => ! $checked,
                            ])>
                            <input
                                id="book-service-{{ $service->id }}"
                                type="checkbox"
                                wire:model="form.services"
                                wire:change="selectService"
                                value="{{ $service->id }}"
                                class="h-5 w-5 rounded border-brand-blush-light text-brand-primary focus:ring-brand-primary/40 shrink-0"
                            >
                            <img
                                src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}"
                                alt=""
                                class="h-12 w-12 rounded-xl object-cover bg-brand-mist shrink-0"
                            >
                            <div class="min-w-0 flex-1">
                                <p class="font-semibold text-brand-ink">{{ $service->item->name }}</p>
                                <p class="text-sm text-brand-ink-muted mt-0.5">
                                    {{ $service->duration_time }} {{ __('app.salon.min_suffix') }}
                                    @if($service->item->price)
                                        · {{ $setting->currency_symbol ?? '$' }}{{ number_format((float) $service->item->price, 2) }}
                                    @endif
                                </p>
                            </div>
                        </label>
                    @empty
                        <p class="text-center text-brand-ink-muted py-8">{{ __('app.booking.no_results') }}</p>
                    @endforelse
                </div>

                @if ($errors->has('form.services'))
                    <p class="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3">
                        {{ __('app.booking.select_service_error') }}
                    </p>
                @endif
            @break

            @case(3)
                <h2 class="font-serif text-2xl sm:text-3xl font-semibold text-brand-ink text-center mb-8">
                    {{ __('app.booking.when_title') }}
                </h2>

                <div class="max-w-md mx-auto space-y-6">
                    <div class="rounded-xl bg-brand-warm/70 border border-brand-blush-light/70 px-4 py-3 text-sm text-brand-ink-muted">
                        {{ __('app.booking.date_hint') }}
                    </div>

                    <div>
                        <label for="dateAppointment" class="block text-sm font-medium text-brand-ink mb-2">{{ __('app.booking.date_label') }}</label>
                        <input
                            type="date"
                            id="dateAppointment"
                            wire:model.live="form.date"
                            wire:change="changeDate"
                            min="{{ now()->addDay()->toDateString() }}"
                            class="w-full rounded-xl border border-brand-blush-light/90 bg-white px-4 py-3 text-brand-ink shadow-sm
                                   focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 outline-none transition"
                        >
                        @error('form.date')
                            <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    @if (! empty($availableSchedules))
                        <div>
                            <p class="block text-sm font-medium text-brand-ink mb-3">{{ __('app.booking.time_label') }}</p>
                            <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                @foreach ($availableSchedules as $schedule)
                                    @php $slot = $schedule['start']; @endphp
                                    <button
                                        type="button"
                                        wire:click="selectTime('{{ $slot }}')"
                                        @class([
                                            'rounded-xl px-2 py-2.5 text-sm font-semibold transition border',
                                            'bg-brand-primary text-brand-primary-dark border-brand-primary shadow-sm' => (string) $form->time === (string) $slot,
                                            'bg-white text-brand-ink border-brand-blush-light/90 hover:border-brand-primary/50' => (string) $form->time !== (string) $slot,
                                        ])
                                    >
                                        {{ $slot }}
                                    </button>
                                @endforeach
                            </div>
                            @error('form.time')
                                <p class="mt-2 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>
                    @elseif(filled($form->date))
                        <p class="text-sm text-center text-brand-ink-muted py-4">{{ __('app.booking.no_slots') }}</p>
                    @endif
                </div>
            @break

            @case(4)
                <h2 class="font-serif text-2xl sm:text-3xl font-semibold text-brand-ink text-center mb-8">
                    {{ __('app.booking.appointment_title') }}
                </h2>

                <div class="max-w-lg mx-auto space-y-6">
                    @if($selectedEmployee)
                    <div class="rounded-2xl border border-brand-blush-light/80 bg-brand-base/50 p-5 space-y-4">
                        <div class="flex items-center gap-3">
                            <img
                                src="{{ asset($this->verySmall('storage/employees/', $selectedEmployee->image)) }}"
                                alt=""
                                class="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                            >
                            <div>
                                <p class="text-xs uppercase tracking-wider text-brand-ink-muted">{{ __('app.booking.you_will_be_served_by') }}</p>
                                <p class="font-semibold text-brand-ink">{{ $selectedEmployee->name }}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 pt-3 border-t border-brand-blush-light/70 text-sm">
                            <div>
                                <p class="text-brand-ink-muted">{{ __('app.booking.date_prefix') }}</p>
                                <p class="font-semibold text-brand-ink mt-0.5">{{ \Carbon\Carbon::parse($form->date)->format('d/m/Y') }}</p>
                            </div>
                            <div>
                                <p class="text-brand-ink-muted">{{ __('app.booking.time_prefix') }}</p>
                                <p class="font-semibold text-brand-ink mt-0.5">{{ \Carbon\Carbon::parse($form->time)->format('H:i') }}</p>
                            </div>
                        </div>
                    </div>
                    @endif

                    @if ($selectedServices)
                        <div>
                            <h3 class="text-sm font-semibold uppercase tracking-wider text-brand-ink-muted mb-3">{{ __('app.booking.services_heading') }}</h3>
                            <ul class="space-y-2">
                                @foreach ($selectedServices as $service)
                                    <li class="flex items-center gap-3 rounded-xl border border-brand-blush-light/70 bg-white/70 px-3 py-2.5">
                                        <img
                                            src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}"
                                            alt=""
                                            class="h-10 w-10 rounded-lg object-cover"
                                        >
                                        <span class="flex-1 text-sm font-medium text-brand-ink">{{ $service->item->name }}</span>
                                        <span class="text-sm font-semibold text-brand-ink">
                                            {{ $setting->currency_symbol ?? '$' }}{{ number_format((float) $service->item->price, 2) }}
                                        </span>
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                    @endif

                    @auth
                        @if(Auth::user()->hasRole('Customer'))
                            <form wire:submit="save" class="rounded-2xl border border-brand-blush-light/80 bg-brand-warm/50 p-5 space-y-4">
                                <p class="text-sm text-brand-ink">{{ __('app.booking.confirm_email_notice') }}</p>
                                <p class="text-xs text-brand-ink-muted">{{ __('app.booking.cancel_window_notice') }}</p>
                                <button type="submit"
                                    class="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold
                                           text-brand-primary-dark bg-brand-primary hover:bg-brand-primary-hover transition shadow-md shadow-brand-primary/25 min-h-[48px]">
                                    {{ __('app.booking.confirm_button') }}
                                </button>
                            </form>
                        @else
                            <div class="rounded-2xl border border-brand-blush-light/80 bg-brand-warm/50 p-5 text-center space-y-4">
                                <p class="text-sm text-brand-ink">{{ __('app.booking.role_customer_required') }}</p>
                                <a href="{{ tenant_url('/') }}"
                                   class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold border border-brand-blush-light text-brand-ink hover:bg-white transition">
                                    {{ __('app.booking.back_home') }}
                                </a>
                            </div>
                        @endif
                    @else
                        <div class="rounded-2xl border border-brand-blush-light/80 bg-brand-warm/50 p-5 text-center space-y-4">
                            <p class="text-sm text-brand-ink">{{ __('app.booking.login_required') }}</p>
                            <a href="{{ tenant_url('/login') }}"
                               class="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold
                                      text-brand-primary-dark bg-brand-primary hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/25">
                                {{ __('app.booking.login_button') }}
                            </a>
                        </div>
                    @endauth

                    @if ($errors->any())
                        <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <ul class="list-disc list-inside space-y-1">
                                @foreach ($errors->all() as $error)
                                    <li>{{ $error }}</li>
                                @endforeach
                            </ul>
                        </div>
                    @endif
                </div>
            @break
        @endswitch

        {{-- Actions --}}
        <div class="mt-8 pt-6 border-t border-brand-blush-light/70 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            @if ($step != 1 && $step <= 3)
                <button type="button" wire:click="previousStep"
                    class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                           text-brand-ink bg-white border border-brand-blush-light hover:bg-brand-warm transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    {{ __('app.booking.back') }}
                </button>
            @elseif ($step > 3)
                <button type="button" wire:click="goToStepOne"
                    class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                           text-brand-ink bg-white border border-brand-blush-light hover:bg-brand-warm transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    {{ __('app.booking.return') }}
                </button>
            @else
                <span class="hidden sm:block"></span>
            @endif

            @if ($step <= 3)
                <button type="button" wire:click="nextStep"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
                           text-brand-primary-dark bg-brand-primary hover:bg-brand-primary-hover transition shadow-sm shadow-brand-primary/25 min-h-[44px]">
                    {{ __('app.booking.continue') }}
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </button>
            @endif
        </div>
    </div>
</div>
