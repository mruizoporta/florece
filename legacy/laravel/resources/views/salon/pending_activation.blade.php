<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ __('salon.pending_meta_title') }}</title>
    <x-favicon-links />
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=cormorant-garamond:400,500,600,700|dm-sans:400,500,600,700&display=swap" rel="stylesheet" />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans antialiased text-gray-800 min-h-screen flex flex-col bg-gradient-to-b from-shearly-50 via-white to-shearly-50/40">
    <div class="fixed top-4 right-4 z-50">
        <x-language-switch variant="salon" />
    </div>

    <main class="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div class="w-full max-w-lg">
            <a href="{{ route('welcome') }}" class="inline-flex items-center gap-2 text-shearly-600 hover:text-shearly-700 transition mb-10 sm:mb-12">
                <x-shearly-logo class="w-8 h-8 shrink-0" />
                <span class="font-serif text-xl font-semibold tracking-tight">Shearly</span>
            </a>

            <div class="relative rounded-3xl bg-white/90 backdrop-blur-sm border border-shearly-100 shadow-xl shadow-shearly-200/40 overflow-hidden">
                <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-shearly-400 via-shearly-500 to-shearly-600"></div>
                <div class="px-8 sm:px-10 pt-12 pb-10 sm:pt-14 sm:pb-12">
                    <div class="flex justify-center mb-8">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-shearly-100 to-shearly-50 border border-shearly-200/80 shadow-inner">
                            <svg class="w-8 h-8 text-shearly-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>

                    <h1 class="font-serif text-3xl sm:text-4xl font-semibold text-gray-900 text-center leading-tight tracking-tight">
                        {{ __('salon.pending_headline') }}
                    </h1>
                    <p class="mt-3 text-center text-base text-shearly-700/90 font-medium">
                        {{ __('salon.pending_lead') }}
                    </p>
                    <p class="mt-6 text-center text-sm sm:text-[15px] text-gray-600 leading-relaxed max-w-md mx-auto">
                        {{ __('salon.pending_body') }}
                    </p>

                    @auth
                        <p class="mt-8 text-center text-sm text-gray-600 leading-relaxed border-t border-shearly-100 pt-8">
                            {{ __('salon.pending_customer_hint') }}
                        </p>
                    @endauth

                    <div class="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center sm:items-center">
                        @guest
                            <a href="{{ tenant_url('/login') }}"
                               class="inline-flex justify-center items-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-shearly-500 hover:bg-shearly-600 border border-transparent shadow-lg shadow-shearly-300/50 focus:outline-none focus:ring-2 focus:ring-shearly-500 focus:ring-offset-2 transition">
                                {{ __('salon.pending_cta_activate') }}
                            </a>
                            <a href="{{ route('welcome') }}"
                               class="inline-flex justify-center items-center px-8 py-3.5 rounded-xl text-base font-medium text-shearly-800 bg-white hover:bg-shearly-50 border border-shearly-200 focus:outline-none focus:ring-2 focus:ring-shearly-400 focus:ring-offset-2 transition">
                                {{ __('salon.pending_cta_shearly') }}
                            </a>
                        @else
                            <a href="{{ route('welcome') }}"
                               class="inline-flex justify-center items-center px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-shearly-500 hover:bg-shearly-600 border border-transparent shadow-lg shadow-shearly-300/50 focus:outline-none focus:ring-2 focus:ring-shearly-500 focus:ring-offset-2 transition">
                                {{ __('salon.pending_cta_shearly') }}
                            </a>
                        @endguest
                    </div>

                    @guest
                        <p class="mt-8 text-center">
                            <a href="{{ route('welcome') }}" class="text-sm text-gray-500 hover:text-shearly-600 transition">
                                {{ __('salon.pending_cta_home') }}
                            </a>
                        </p>
                    @endguest
                </div>
            </div>

            <p class="mt-8 text-center text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                {{ __('salon.pending_footer_blurb') }}
            </p>
        </div>
    </main>
</body>
</html>
