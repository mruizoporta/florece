@props(['variant' => 'single', 'label' => null])
@php
    $labelText = $label ?? __('app.dashboard.loading_metrics');
@endphp

<div class="shearly-widget-placeholder flex min-h-[3.5rem] flex-col justify-center gap-2">
    <p class="shearly-widget-loading-label">{{ $labelText }}</p>
    @if ($variant === 'fraction')
        <div class="flex items-baseline gap-2 animate-pulse">
            <div class="h-10 w-12 rounded-lg bg-brand-blush-light/40"></div>
            <div class="h-6 w-3 rounded bg-brand-primary/15"></div>
            <div class="h-9 w-16 rounded-lg bg-brand-warm/40"></div>
        </div>
    @elseif ($variant === 'currency')
        <div class="animate-pulse">
            <div class="h-10 w-36 max-w-full rounded-lg bg-brand-blush-light/40"></div>
        </div>
    @else
        <div class="animate-pulse">
            <div class="h-10 w-28 max-w-full rounded-lg bg-brand-blush-light/40"></div>
        </div>
    @endif
</div>
