<div>
    <div x-data="{ open: false }"
         @open-simple-appointment.window="open = true"
         @close-simple-appointment-modal.window="open = false"
         @keydown.escape.window="open = false">

        <div x-show="open"
             x-cloak
             x-transition:enter="transition ease-out duration-200"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition ease-in duration-150"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-[80] flex items-center justify-center bg-brand-ink/40 backdrop-blur-sm p-4"
             @click.self="open = false"
             role="dialog"
             aria-modal="true"
             aria-labelledby="simple-appt-title">

            <div x-show="open"
                 x-transition:enter="transition ease-out duration-200"
                 x-transition:enter-start="opacity-0 scale-95 translate-y-1"
                 x-transition:enter-end="opacity-100 scale-100 translate-y-0"
                 x-transition:leave="transition ease-in duration-150"
                 x-transition:leave-start="opacity-100 scale-100"
                 x-transition:leave-end="opacity-0 scale-95"
                 @click.stop
                 class="w-full max-w-md rounded-2xl bg-brand-base border border-brand-blush-light/80 shadow-2xl shadow-brand-ink/10 overflow-hidden">

                <form wire:submit="save">
                    <div class="px-6 pt-5 pb-4 border-b border-brand-blush-light/60 flex items-start justify-between gap-4">
                        <h2 id="simple-appt-title" class="font-serif text-lg font-semibold text-brand-ink leading-tight">
                            Nueva agenda
                        </h2>
                        <button type="button"
                                @click="open = false"
                                class="shrink-0 p-1.5 rounded-lg text-brand-ink-muted hover:text-brand-ink hover:bg-brand-warm transition-colors"
                                aria-label="Cerrar">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>

                    <div class="px-6 py-5">
                        <label for="simple-appt-name" class="block text-xs font-semibold uppercase tracking-wide text-brand-ink-muted mb-1.5">Nombre del cliente</label>
                        <input id="simple-appt-name"
                               type="text"
                               wire:model.blur="form.name"
                               autocomplete="name"
                               class="w-full rounded-xl border border-brand-blush-light bg-white px-3.5 py-2.5 text-sm text-brand-ink
                                      placeholder:text-brand-ink-muted/40 transition-all
                                      focus:border-brand-primary/40 focus:outline-none focus:ring-2 focus:ring-brand-primary/15" />
                        @error('form.name')
                            <p class="mt-1.5 text-xs text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="flex items-center justify-end gap-2 px-6 py-4 bg-brand-warm/40 border-t border-brand-blush-light/60">
                        <button type="button"
                                @click="open = false"
                                class="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-brand-ink-muted
                                       border border-brand-blush-light bg-white hover:bg-brand-warm transition-colors">
                            Cerrar
                        </button>
                        <button type="submit"
                                class="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-primary-dark
                                       shadow-sm shadow-brand-primary/30 transition-all hover:bg-brand-primary-hover hover:shadow-md disabled:opacity-60">
                            <span wire:loading.remove wire:target="save">Guardar</span>
                            <span wire:loading wire:target="save" class="inline-flex items-center gap-2">
                                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Guardando…
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
