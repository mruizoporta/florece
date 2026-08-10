@props([
    'variant' => 'primary',
    'size' => 'md',
    'type' => 'button',
])

@php
    $variantClasses = match ($variant) {
        'secondary' => 'btn btn-outline-secondary shearly-btn-secondary',
        'ghost' => 'btn btn-link text-brand-ink',
        default => 'btn btn-primary shearly-btn-primary',
    };

    $sizeClasses = match ($size) {
        'sm' => 'btn-sm',
        'lg' => 'btn-lg',
        default => '',
    };
@endphp

<button type="{{ $type }}" {{ $attributes->class(trim($variantClasses.' '.$sizeClasses)) }}>
    {{ $slot }}
</button>

