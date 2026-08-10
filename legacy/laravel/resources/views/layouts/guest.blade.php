<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ $title ?? config('app.name', 'Shearly') }}</title>

        <x-favicon-links />

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=cormorant-garamond:400,500,600,700|dm-sans:400,500,600,700&display=swap" rel="stylesheet" />

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans text-brand-ink antialiased min-h-screen bg-brand-base">
        {{-- Fondo cálido alineado con landing: capas suaves + grano sutil opcional vía gradiente --}}
        <div class="min-h-screen bg-gradient-to-b from-brand-base via-brand-rose-mist/40 to-brand-mist/35">
            <div class="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12 md:py-16">
                <div class="w-full max-w-md flex flex-col">
                    {{-- Barra superior: logo + idioma en un solo ancho controlado --}}
                    <div class="flex items-center justify-between gap-3 sm:gap-4 min-w-0 mb-6 sm:mb-8">
                        <a
                            href="{{ route('welcome') }}"
                            wire:navigate
                            class="inline-flex items-center gap-2 sm:gap-2.5 min-w-0 group text-brand-ink transition hover:opacity-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-base rounded-lg"
                        >
                            <x-shearly-logo class="w-9 h-9 sm:w-10 sm:h-10 text-shearly-800 shrink-0" />
                            <span class="font-serif text-2xl sm:text-[1.75rem] font-semibold tracking-tight truncate pt-0.5">Shearly</span>
                        </a>
                        <x-language-switch variant="guest" class="shrink-0" />
                    </div>

                    {{-- Card principal --}}
                    <div
                        class="w-full rounded-3xl border border-black/[0.06] bg-white px-8 py-10 sm:px-10 sm:py-12 shadow-[0_0_0_1px_rgba(29,31,36,0.03),0_24px_48px_-16px_rgba(29,31,36,0.12),0_12px_24px_-10px_rgba(29,31,36,0.06)]"
                    >
                        {{ $slot }}
                    </div>

                    @unless (request()->routeIs('verification.notice', 'password.confirm'))
                        <div class="mt-8 sm:mt-10 text-center px-1">
                            <p class="text-sm text-brand-ink-muted leading-relaxed">
                                @if (request()->routeIs('login'))
                                    {{ __('app.auth.footer_need_salon') }}
                                @else
                                    {{ __('app.auth.already_have_account') }}
                                @endif
                            </p>
                            <a
                                href="{{ request()->routeIs('login') ? route('register.salon') : route('login') }}"
                                wire:navigate
                                class="mt-3 inline-flex items-center justify-center min-h-[2.75rem] w-full sm:w-auto sm:min-w-[12rem] px-5 rounded-full text-sm font-semibold text-brand-ink border border-gray-200/90 bg-white/80 hover:bg-white hover:border-gray-300/90 hover:shadow-sm transition shadow-[0_1px_2px_rgba(29,31,36,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                            >
                                {{ request()->routeIs('login') ? __('app.auth.create_salon_account') : __('app.nav.login') }}
                            </a>
                        </div>
                    @endunless
                </div>
            </div>
        </div>
    </body>
</html>
