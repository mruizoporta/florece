@if ($paginator->hasPages())
<nav role="navigation" aria-label="{{ __('Pagination Navigation') }}"
     class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4
            px-6 py-4 bg-brand-warm/30 border-t border-brand-blush-light/60">

    {{-- Resumen de resultados --}}
    <p class="text-xs text-brand-ink-muted leading-none order-2 sm:order-1">
        Mostrando
        <span class="font-semibold text-brand-ink">{{ $paginator->firstItem() }}</span>
        –
        <span class="font-semibold text-brand-ink">{{ $paginator->lastItem() }}</span>
        de
        <span class="font-semibold text-brand-ink">{{ $paginator->total() }}</span>
        resultados
    </p>

    {{-- Controles de navegación --}}
    <div class="flex items-center gap-1 order-1 sm:order-2">

        {{-- Anterior --}}
        @if ($paginator->onFirstPage())
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                         border border-brand-blush-light/50 bg-white
                         text-brand-ink-muted/30 cursor-not-allowed select-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
                </svg>
            </span>
        @else
            <button wire:click="previousPage" wire:loading.attr="disabled" rel="prev"
                    class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                           border border-brand-blush-light bg-white text-brand-ink-muted
                           hover:bg-brand-warm hover:border-brand-primary/30 hover:text-brand-ink
                           active:scale-95 transition-all duration-150 cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
                </svg>
            </button>
        @endif

        {{-- Números de página --}}
        @foreach ($elements as $element)

            {{-- Ellipsis --}}
            @if (is_string($element))
                <span class="inline-flex items-center justify-center w-9 h-9 text-xs
                             text-brand-ink-muted/40 select-none tracking-widest">
                    {{ $element }}
                </span>
            @endif

            {{-- Páginas --}}
            @if (is_array($element))
                @foreach ($element as $page => $url)
                    @if ($page == $paginator->currentPage())
                        {{-- Activa --}}
                        <span aria-current="page"
                              class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                                     bg-brand-primary border border-brand-primary/20
                                     text-brand-primary-dark text-xs font-bold
                                     shadow-sm shadow-brand-primary/25 select-none">
                            {{ $page }}
                        </span>
                    @else
                        {{-- Inactiva --}}
                        <button wire:click="gotoPage({{ $page }})" wire:loading.attr="disabled"
                                class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                                       border border-brand-blush-light bg-white
                                       text-xs text-brand-ink-muted
                                       hover:bg-brand-warm hover:border-brand-primary/30 hover:text-brand-ink
                                       active:scale-95 transition-all duration-150 cursor-pointer">
                            {{ $page }}
                        </button>
                    @endif
                @endforeach
            @endif

        @endforeach

        {{-- Siguiente --}}
        @if ($paginator->hasMorePages())
            <button wire:click="nextPage" wire:loading.attr="disabled" rel="next"
                    class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                           border border-brand-blush-light bg-white text-brand-ink-muted
                           hover:bg-brand-warm hover:border-brand-primary/30 hover:text-brand-ink
                           active:scale-95 transition-all duration-150 cursor-pointer">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
            </button>
        @else
            <span class="inline-flex items-center justify-center w-9 h-9 rounded-lg
                         border border-brand-blush-light/50 bg-white
                         text-brand-ink-muted/30 cursor-not-allowed select-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
            </span>
        @endif

    </div>
</nav>
@endif
