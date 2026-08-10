@props(['class' => 'w-8 h-8', 'showText' => false])

@php
    $showText = filter_var($showText ?? false, FILTER_VALIDATE_BOOLEAN);
@endphp

<div {{ $attributes->merge(['class' => 'inline-flex items-center gap-2']) }}>
    <svg class="{{ $class }} flex-shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {{-- Shearly: S fluida inspirada en tijeras y belleza --}}
        <path d="M24 6c-2 0-6 2-8 6s-2 8 0 12c2 4 6 6 8 6M8 26c2 0 6-2 8-6s2-8 0-12c-2-4-6-6-8-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    @if($showText)
        <span class="font-serif text-xl font-semibold text-current">Shearly</span>
    @endif
</div>
