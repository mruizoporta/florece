@props([
    'type' => 'submit',
])

<button
    type="{{ $type }}"
    {{ $attributes->except('type')->merge(['class' => 'inline-flex items-center justify-center min-h-[3rem] px-6 py-3.5 rounded-2xl bg-brand-primary text-brand-primary-dark font-semibold text-[15px] tracking-tight shadow-[0_2px_8px_-1px_rgba(102,85,0,0.25),0_4px_16px_-4px_rgba(255,210,0,0.35)] hover:bg-brand-primary-hover hover:shadow-[0_4px_20px_-2px_rgba(102,85,0,0.28),0_8px_24px_-6px_rgba(255,210,0,0.4)] active:scale-[0.99] active:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100']) }}
>
    {{ $slot }}
</button>
