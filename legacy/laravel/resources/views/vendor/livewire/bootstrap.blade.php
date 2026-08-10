{{--
    Paginación Livewire (tema: bootstrap → vista: livewire::bootstrap)
    Estilos Shearly / Tailwind. Misma lógica y wire:* que el vendor Livewire.
--}}
@php
if (! isset($scrollTo)) {
    $scrollTo = 'body';
}

$scrollIntoViewJsSnippet = ($scrollTo !== false)
    ? <<<JS
       (\$el.closest('{$scrollTo}') || document.querySelector('{$scrollTo}')).scrollIntoView()
    JS
    : '';
@endphp

<div>
    @if ($paginator->hasPages())
        <nav class="mt-4 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between" role="navigation" aria-label="{{ __('Pagination Navigation') }}">

            {{-- Móvil: anterior / siguiente --}}
            <div class="flex w-full justify-between gap-2 sm:hidden">
                @if ($paginator->onFirstPage())
                    <span class="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-400 cursor-not-allowed" aria-disabled="true">
                        @lang('pagination.previous')
                    </span>
                @else
                    <button type="button"
                        dusk="previousPage{{ $paginator->getPageName() == 'page' ? '' : '.' . $paginator->getPageName() }}"
                        wire:click="previousPage('{{ $paginator->getPageName() }}')"
                        x-on:click="{{ $scrollIntoViewJsSnippet }}"
                        wire:loading.attr="disabled"
                        class="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-text shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 disabled:opacity-50">
                        @lang('pagination.previous')
                    </button>
                @endif

                @if ($paginator->hasMorePages())
                    <button type="button"
                        dusk="nextPage{{ $paginator->getPageName() == 'page' ? '' : '.' . $paginator->getPageName() }}"
                        wire:click="nextPage('{{ $paginator->getPageName() }}')"
                        x-on:click="{{ $scrollIntoViewJsSnippet }}"
                        wire:loading.attr="disabled"
                        class="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-brand-text shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 disabled:opacity-50">
                        @lang('pagination.next')
                    </button>
                @else
                    <span class="inline-flex min-h-[2.5rem] flex-1 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-400 cursor-not-allowed" aria-disabled="true">
                        @lang('pagination.next')
                    </span>
                @endif
            </div>

            {{-- Desktop: resumen + páginas --}}
            <div class="hidden w-full flex-col gap-4 sm:flex sm:flex-1 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-brand-textMuted">
                    {!! __('Showing') !!}
                    <span class="font-semibold text-brand-text tabular-nums">{{ $paginator->firstItem() }}</span>
                    {!! __('to') !!}
                    <span class="font-semibold text-brand-text tabular-nums">{{ $paginator->lastItem() }}</span>
                    {!! __('of') !!}
                    <span class="font-semibold text-brand-text tabular-nums">{{ $paginator->total() }}</span>
                    {!! __('results') !!}
                </p>

                <div class="inline-flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                    {{-- Anterior --}}
                    @if ($paginator->onFirstPage())
                        <span class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-gray-300 cursor-not-allowed" aria-disabled="true" aria-label="@lang('pagination.previous')">
                            <span aria-hidden="true" class="text-lg leading-none">&lsaquo;</span>
                        </span>
                    @else
                        <button type="button"
                            dusk="previousPage{{ $paginator->getPageName() == 'page' ? '' : '.' . $paginator->getPageName() }}"
                            wire:click="previousPage('{{ $paginator->getPageName() }}')"
                            x-on:click="{{ $scrollIntoViewJsSnippet }}"
                            wire:loading.attr="disabled"
                            class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-sm font-medium text-brand-textMuted transition hover:bg-gray-100 hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 disabled:opacity-50"
                            aria-label="@lang('pagination.previous')">
                            <span aria-hidden="true" class="text-lg leading-none">&lsaquo;</span>
                        </button>
                    @endif

                    {{-- Números y puntos --}}
                    @foreach ($elements as $element)
                        @if (is_string($element))
                            <span class="inline-flex h-9 min-w-[2.25rem] items-center justify-center px-1 text-sm font-medium text-brand-textMuted" aria-disabled="true">{{ $element }}</span>
                        @endif

                        @if (is_array($element))
                            @foreach ($element as $page => $url)
                                @if ($page == $paginator->currentPage())
                                    <span wire:key="paginator-{{ $paginator->getPageName() }}-page-{{ $page }}"
                                        class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg bg-brand-primary px-2 text-sm font-semibold text-brand-primary-dark shadow-sm ring-1 ring-brand-primary/25"
                                        aria-current="page">
                                        {{ $page }}
                                    </span>
                                @else
                                    <button type="button"
                                        wire:key="paginator-{{ $paginator->getPageName() }}-page-{{ $page }}"
                                        wire:click="gotoPage({{ $page }}, '{{ $paginator->getPageName() }}')"
                                        x-on:click="{{ $scrollIntoViewJsSnippet }}"
                                        class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-2 text-sm font-medium text-brand-textMuted transition hover:bg-gray-100 hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35">
                                        {{ $page }}
                                    </button>
                                @endif
                            @endforeach
                        @endif
                    @endforeach

                    {{-- Siguiente --}}
                    @if ($paginator->hasMorePages())
                        <button type="button"
                            dusk="nextPage{{ $paginator->getPageName() == 'page' ? '' : '.' . $paginator->getPageName() }}"
                            wire:click="nextPage('{{ $paginator->getPageName() }}')"
                            x-on:click="{{ $scrollIntoViewJsSnippet }}"
                            wire:loading.attr="disabled"
                            class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-sm font-medium text-brand-textMuted transition hover:bg-gray-100 hover:text-brand-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 disabled:opacity-50"
                            aria-label="@lang('pagination.next')">
                            <span aria-hidden="true" class="text-lg leading-none">&rsaquo;</span>
                        </button>
                    @else
                        <span class="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg text-gray-300 cursor-not-allowed" aria-disabled="true" aria-label="@lang('pagination.next')">
                            <span aria-hidden="true" class="text-lg leading-none">&rsaquo;</span>
                        </span>
                    @endif
                </div>
            </div>
        </nav>
    @endif
</div>
