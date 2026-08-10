@props(['value', 'variant' => 'default'])

@php
    $labelClass = match ($variant) {
        'auth' => 'block text-[13px] font-semibold text-brand-ink/75 tracking-wide',
        default => 'block font-medium text-sm text-gray-700 dark:text-gray-300',
    };
@endphp

<label {{ $attributes->merge(['class' => $labelClass]) }}>
    {{ $value ?? $slot }}
</label>
