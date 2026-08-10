<div x-data="{ open: false }"
     @open-board-tickets.window="open = true"
     @keydown.escape.window="open = false">

    <div x-show="open"
         x-cloak
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="fixed inset-0 z-[75] flex justify-end bg-brand-ink/40 backdrop-blur-sm">

        <div class="absolute inset-0" @click="open = false" aria-hidden="true"></div>

        <div x-show="open"
             x-transition:enter="transition ease-out duration-200"
             x-transition:enter-start="translate-x-full"
             x-transition:enter-end="translate-x-0"
             x-transition:leave="transition ease-in duration-200"
             x-transition:leave-start="translate-x-0"
             x-transition:leave-end="translate-x-full"
             @click.stop
             class="relative z-10 flex h-full w-full max-w-md flex-col bg-brand-base shadow-2xl shadow-brand-ink/20 border-l border-brand-blush-light/80">

            <div class="flex items-center justify-between gap-3 border-b border-brand-blush-light/60 px-4 py-3 shrink-0">
                <h2 class="font-serif text-lg font-semibold text-brand-ink">Tickets</h2>
                <button type="button"
                        @click="open = false"
                        class="p-2 rounded-lg text-brand-ink-muted hover:text-brand-ink hover:bg-brand-warm transition-colors"
                        aria-label="Cerrar panel">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                @forelse ($orders as $order)
                    <div wire:key="order-bd-{{ $order->id }}" class="rounded-2xl border border-brand-blush-light/80 bg-white p-4 shadow-sm">
                        <div class="flex flex-col items-center gap-1 border-b border-brand-blush-light/50 pb-3 mb-3">
                            <svg class="w-8 h-8 text-brand-ink-muted/50" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                            </svg>
                            <p class="text-sm font-semibold text-brand-ink text-center">{{ $order->name }}</p>
                        </div>

                        @foreach ($order->items as $item)
                            <div wire:key="oi-{{ $item->id }}" class="flex flex-wrap items-center gap-2 py-2 border-b border-brand-blush-light/40 last:border-0">
                                <img class="h-12 w-12 rounded-lg object-cover ring-1 ring-brand-blush-light/60 shrink-0"
                                     src="{{ asset($this->verySmall('storage/items/', $item->item->image)) }}"
                                     alt="" loading="lazy">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <button type="button"
                                                wire:click="decrementQuantity(@js($item->only(['id', 'order_id', 'item_id', 'quantity'])))"
                                                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-blush-light text-brand-ink-muted hover:bg-brand-warm transition-colors">
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14"/>
                                            </svg>
                                        </button>
                                        <span class="text-sm font-semibold text-brand-ink tabular-nums">×{{ $item->quantity }}</span>
                                        <button type="button"
                                                wire:click="incrementQuantity(@js($item->only(['id', 'order_id', 'item_id', 'quantity'])), {{ $item->quantity }})"
                                                class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-brand-blush-light text-brand-ink-muted hover:bg-brand-warm transition-colors">
                                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                            </svg>
                                        </button>
                                    </div>
                                    <div class="mt-1 flex items-center justify-between gap-2 flex-wrap">
                                        <span class="text-xs text-brand-ink-muted">{{ $item->item->name }}</span>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs text-brand-ink-muted">{{ $item->price }}</span>
                                            <button type="button"
                                                    wire:click="deleteItemOrder({{ $item->id }}, {{ $order->id }}, @js($item->item->name))"
                                                    class="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Eliminar línea">
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div class="w-full text-right text-sm font-semibold text-brand-primary-dark shrink-0">
                                    {{ number_format($item->price * $item->quantity, 2) }}
                                </div>
                            </div>
                        @endforeach

                        <div class="mt-3 pt-3 border-t border-brand-blush-light/60 flex items-center justify-between">
                            <span class="text-sm font-medium text-brand-ink-muted">Total</span>
                            <span class="text-base font-bold text-brand-primary-dark tabular-nums">{{ number_format($order->total, 2) }}</span>
                        </div>

                        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div class="relative" x-data="{ addOpen: false }" @click.outside="addOpen = false">
                                <button type="button"
                                        @click="addOpen = !addOpen; $wire.loadItems()"
                                        class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary-dark border border-brand-primary/25 hover:bg-brand-primary/25 transition-colors"
                                        title="Añadir artículo">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                                    </svg>
                                </button>
                                <div x-show="addOpen"
                                     x-cloak
                                     x-transition
                                     class="absolute left-0 bottom-full mb-2 z-20 w-64 max-h-56 overflow-y-auto rounded-xl border border-brand-blush-light/80 bg-white py-1 shadow-lg">
                                    @if(!$loadedItems)
                                        <div class="flex justify-center py-4">
                                            <svg class="animate-spin h-5 w-5 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                            </svg>
                                        </div>
                                    @endif
                                    @foreach ($items as $item)
                                        <button type="button"
                                                wire:key="add-item-{{ $item->id }}"
                                                wire:click="addItem({{ $order->id }}, {{ $item->id }}, @js($item->name))"
                                                @click="addOpen = false"
                                                class="w-full text-left px-3 py-2 text-sm text-brand-ink hover:bg-brand-warm transition-colors">
                                            {{ $item->name }}
                                        </button>
                                    @endforeach
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2 justify-end">
                                <button type="button"
                                        wire:click="cancelOrder({{ $order->id }})"
                                        class="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors">
                                    Rechazar
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                                    </svg>
                                </button>
                                <button type="button"
                                        wire:click="confirmOrder({{ $order->id }})"
                                        class="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                                    Confirmar
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                @empty
                    <div class="rounded-2xl border border-dashed border-brand-blush-light/80 bg-brand-warm/30 px-6 py-12 text-center">
                        <p class="text-sm text-brand-ink-muted">Sin tickets pendientes.</p>
                    </div>
                @endforelse
            </div>
        </div>
    </div>
</div>
