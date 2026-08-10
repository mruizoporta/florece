<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="description" content="{{ $metaDescription ?? __('app.meta.landing_description') }}">

    <title>{{ $title ?? __('app.meta.landing_title') }}</title>

    <x-favicon-links />

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=cormorant-garamond:400,500,600,700|dm-sans:400,500,600,700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
</head>
<body class="font-sans text-brand-ink antialiased bg-gradient-to-b from-brand-base via-brand-rose-mist/40 to-brand-mist/30 scroll-smooth scroll-pt-24 lg:scroll-pt-28">
    <main>
        {{ $slot }}
    </main>
    @livewireScripts
    @stack('scripts')
</body>
</html>
