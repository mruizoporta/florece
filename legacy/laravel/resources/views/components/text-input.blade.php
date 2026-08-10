@props(['disabled' => false, 'variant' => 'default'])

@php
    $variantClasses = match ($variant) {
        /** Premium guest auth: superficie clara, foco marca, micro-sombra */
        'auth' => implode(' ', [
            'border border-gray-200/95 bg-white text-brand-ink',
            'placeholder:text-brand-ink-muted/55 placeholder:font-normal',
            'shadow-[0_1px_2px_rgba(29,31,36,0.04)]',
            'hover:border-gray-300/90',
            'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 focus:shadow-[0_0_0_3px_rgba(255,210,0,0.15)]',
            'rounded-2xl py-3 px-3.5 text-[15px] leading-snug tracking-tight',
            'transition-[border-color,box-shadow] duration-150',
            'disabled:bg-brand-mist/40 disabled:text-brand-ink-muted',
        ]),
        default => 'border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm',
    };
@endphp

<input {{ $disabled ? 'disabled' : '' }} {!! $attributes->merge(['class' => $variantClasses]) !!}>
