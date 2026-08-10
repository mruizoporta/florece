@props(['variant' => 'landing'])

@php
    $active = match ($variant) {
        'guest', 'dashboard' => 'bg-brand-primary text-brand-primary-dark shadow-sm ring-1 ring-brand-primary/35 font-semibold',
        'salon' => 'text-shearly-600 font-semibold',
        'landing-pill' => 'bg-white text-brand-primary-dark shadow-sm ring-1 ring-brand-primary/25 font-semibold',
        default => 'text-brand-primary-dark font-semibold',
    };
    $inactive = match ($variant) {
        'guest', 'dashboard' => 'text-brand-textMuted hover:text-brand-text hover:bg-gray-50',
        'salon' => 'text-gray-500 hover:text-shearly-600',
        'landing-pill' => 'text-brand-ink-muted hover:text-brand-ink hover:bg-white/80',
        default => 'text-brand-ink-muted hover:text-brand-ink',
    };
    $sep = match ($variant) {
        'guest', 'dashboard' => '',
        'salon' => 'text-gray-300',
        'landing-pill' => 'text-brand-ink-muted/30 w-px h-4 bg-gray-200 shrink-0',
        default => 'text-brand-ink-muted/50',
    };
    $wrapper = match ($variant) {
        /** Toggle [ ES ][ EN ] integrado, sin texto flotante */
        'guest', 'dashboard' => 'inline-flex items-center gap-0.5 rounded-full border border-gray-200/95 bg-white p-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-sm',
        'landing-pill' => 'inline-flex items-center gap-0.5 rounded-full border border-brand-blush-light/80 bg-brand-alt/90 p-1 text-xs font-semibold shadow-sm',
        default => 'flex items-center gap-1.5 text-sm font-medium',
    };
    $linkBase = in_array($variant, ['landing-pill', 'guest', 'dashboard'], true)
        ? 'inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1.5 rounded-full transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white'
        : '';
@endphp

<div {{ $attributes->merge(['class' => $wrapper]) }} role="group" aria-label="{{ __('app.nav.language') }}">
    @if ($variant === 'landing-pill')
        <span class="pl-2 pr-0.5 text-sm" aria-hidden="true">🌎</span>
    @endif
    <a
        href="{{ locale_switch_url('es') }}"
        lang="es"
        @if (app()->getLocale() === 'es') aria-current="true" @endif
        class="{{ $linkBase }} {{ app()->getLocale() === 'es' ? $active : $inactive }}"
    >ES</a>
    @if (in_array($variant, ['guest', 'dashboard'], true))
        {{-- Sin separador: dos segmentos tipo control --}}
    @elseif ($variant === 'landing-pill')
        <span class="{{ $sep }}" aria-hidden="true"></span>
    @else
        <span class="{{ $sep }}" aria-hidden="true">|</span>
    @endif
    <a
        href="{{ locale_switch_url('en') }}"
        lang="en"
        @if (app()->getLocale() === 'en') aria-current="true" @endif
        class="{{ $linkBase }} {{ app()->getLocale() === 'en' ? $active : $inactive }}"
    >EN</a>
</div>
