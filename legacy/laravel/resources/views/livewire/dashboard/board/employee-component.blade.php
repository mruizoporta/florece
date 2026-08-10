<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    @foreach ($employees as $employee)
        <div wire:key="board-emp-{{ $employee->id }}"
             class="rounded-2xl border border-brand-blush-light/80 bg-white p-4 shadow-sm">
            <div class="flex flex-col items-center text-center gap-3">
                @if ($employee->image)
                    <img src="{{ asset($this->small('storage/employees/', $employee->image)) }}"
                         alt="{{ $employee->name }}"
                         loading="lazy"
                         class="h-24 w-24 rounded-full object-cover ring-4 {{ $employee->serving ? 'ring-red-400/80' : 'ring-emerald-400/80' }} shadow-md">
                @else
                    <div class="flex h-24 w-24 items-center justify-center rounded-full ring-4 {{ $employee->serving ? 'ring-red-400/80' : 'ring-emerald-400/80' }} bg-brand-primary/15 text-xl font-bold text-brand-primary-dark shadow-md">
                        {{ mb_strtoupper(mb_substr($employee->name, 0, 1)) }}
                    </div>
                @endif
                <p class="font-serif text-base font-semibold text-brand-ink">{{ $employee->name }}</p>

                @if($employee->serving)
                    <div class="flex w-full items-center justify-between gap-2 rounded-xl bg-brand-warm/50 px-3 py-2 border border-brand-blush-light/50">
                        <div class="flex items-center gap-2 min-w-0">
                            <svg class="w-4 h-4 text-brand-ink-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
                            </svg>
                            <span class="text-xs font-medium text-brand-ink truncate">{{ $employee->serving->name }}</span>
                        </div>
                        <div class="flex items-center gap-2 shrink-0">
                            <button type="button"
                                    wire:click="finishAppointment({{ $employee->serving->id }})"
                                    class="p-1.5 rounded-lg text-brand-primary-dark hover:bg-brand-primary/15 transition-colors"
                                    title="Concluir agenda">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9v6m-4.5-6v6m9-13.5a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 4.5v15a2.25 2.25 0 0 0 2.25 2.25h10.5A2.25 2.25 0 0 0 19.5 19.5V6Z"/>
                                </svg>
                            </button>
                            <span class="tabular-nums text-sm font-semibold text-brand-ink"
                                  x-data="{ countdown: { hours: 0, minutes: 0, seconds: 0 } }"
                                  x-init="() => {
                                      const endTime = new Date('{{ $employee->end_time_js }}').getTime();
                                      setInterval(() => {
                                          const now = Date.now();
                                          const timeLeft = Math.max(0, endTime - now);
                                          countdown.hours = Math.floor(timeLeft / (1000 * 60 * 60));
                                          countdown.minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                                          countdown.seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                                      }, 1000);
                                  }"
                                  x-text="String(countdown.hours).padStart(2, '0') + ':' + String(countdown.minutes).padStart(2, '0') + ':' + String(countdown.seconds).padStart(2, '0')">
                            </span>
                        </div>
                    </div>
                @else
                    <div class="w-full rounded-xl border border-dashed border-brand-blush-light/80 bg-brand-warm/20 px-3 py-3 flex items-center justify-between">
                        <span class="text-xs text-brand-ink-muted">Disponible</span>
                        <span class="tabular-nums text-sm font-medium text-brand-ink-muted">--:--:--</span>
                    </div>
                @endif
            </div>
        </div>
    @endforeach
</div>
