<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Debe ir antes del JS de Vite que importa livewire.esm.js --}}
    @livewireScriptConfig

    <title>{{ $title ?? 'Dashboard' }}</title>

    <x-favicon-links />

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=cormorant-garamond:500,600,700|dm-sans:400,500,600,700&display=swap" rel="stylesheet" />

    @vite(['resources/css/app.css', 'resources/css/dashboard.css'])

    {{-- Shim mínimo para clases CoreUI SVG icon (.icon, .icon-lg, .icon-sm)
         Solo sizing — sin cargar Bootstrap ni CoreUI CSS completo --}}
    <style>
        .icon { display: inline-block; color: inherit; fill: currentColor; width: 1rem; height: 1rem; vertical-align: -.125em; }
        .icon-lg { width: 1.5rem !important; height: 1.5rem !important; }
        .icon-sm { width: .875rem !important; height: .875rem !important; }
        .icon-xl { width: 2rem   !important; height: 2rem   !important; }
        [x-cloak] { display: none !important; }
    </style>

    @livewireStyles
    @stack('styles')
</head>

{{--
    Layout: dashboard-new.blade.php
    Stack: Laravel Blade + Tailwind CSS (sin Bootstrap, sin CoreUI)
    Uso con Livewire full-page: ->extends('layouts.dashboard-new', ['title' => '...'])

    Secciones disponibles desde vistas Livewire:
      @section('pageTitle')   → Título en el topbar (fallback: $title)
      @section('breadcrumbs') → Migas de pan (opcional)
      @section('topbarActions') → Botones extra en el topbar (opcional)
      @section('content')    → Contenido principal (Livewire lo rellena automáticamente)
      @stack('styles')       → CSS adicional
      @stack('scripts')      → JS adicional

    Variables pasadas via ->extends():
      $title → <title> del documento y fallback del pageTitle
--}}

@php
    /** @var \App\Models\User|null $authUser */
    $authUser    = Auth::user();
    $userName    = $authUser?->name ?? 'Administrador';
    $userEmail   = $authUser?->email ?? '';
    $initials    = collect(explode(' ', $userName))
                       ->map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)))
                       ->take(2)
                       ->join('');
    $userInitials = $initials ?: 'AD';
    $salonName   = \App\Models\Setting::query()->first()?->company_name ?? 'Mi Salón';
    $pageTitle   = $title ?? 'Dashboard';

    $routeName   = request()->route()?->getName() ?? '';
    $navActive   = fn (string $base): bool =>
                       $routeName === $base || $routeName === $base . '.local';
@endphp

<body class="font-sans antialiased bg-brand-warm text-brand-ink">

    {{-- ════════════════════════════════════════════════════
         WRAPPER: sidebar fijo + área scrollable
    ════════════════════════════════════════════════════ --}}
    <div class="flex h-screen overflow-hidden">

        {{-- ──────────────────────────────────────────────
             SIDEBAR
        ────────────────────────────────────────────── --}}
        <aside
            id="sidebar"
            class="flex flex-col w-64 shrink-0
                   bg-brand-ink text-gray-400
                   transition-transform duration-300 ease-in-out
                   fixed inset-y-0 left-0 z-40
                   lg:static lg:translate-x-0
                   -translate-x-full"
        >

            {{-- Logo / Marca --}}
            <div class="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
                <x-shearly-logo class="w-8 h-8 shrink-0 text-brand-primary" />
                <div class="min-w-0">
                    <span class="block font-serif text-lg font-semibold text-white tracking-tight leading-none">
                        Shearly
                    </span>
                    <span class="block text-[11px] text-gray-500 truncate leading-none mt-0.5">
                        {{ $salonName }}
                    </span>
                </div>
            </div>

            {{-- Navegación --}}
            <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 text-sm">

                {{-- General --}}
                <p class="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
                    General
                </p>

                <a href="{{ tenant_route('dashboard') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
                    </svg>
                    <span>Inicio</span>
                    @if($navActive('dashboard'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.calendar') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.calendar') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.calendar') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                    </svg>
                    <span>Calendario</span>
                    @if($navActive('dashboard.calendar'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.appointments') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.appointments') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.appointments') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"/>
                    </svg>
                    <span>Citas</span>
                    @if($navActive('dashboard.appointments'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.board') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.board') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.board') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
                    </svg>
                    <span>Tablero</span>
                    @if($navActive('dashboard.board'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.users') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.users') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.users') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
                    </svg>
                    <span>{{ __('app.dashboard.users') }}</span>
                    @if($navActive('dashboard.users'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                {{-- Negocio --}}
                <p class="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
                    Negocio
                </p>

                <a href="{{ tenant_route('dashboard.services') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.services') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.services') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185ZM9.75 9h.008v.008H9.75V9Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm4.125 4.5h.008v.008h-.008V13.5Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/>
                    </svg>
                    <span>Servicios</span>
                    @if($navActive('dashboard.services'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.products') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.products') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.products') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
                    </svg>
                    <span>Productos</span>
                    @if($navActive('dashboard.products'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.orders') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.orders') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.orders') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5"/>
                    </svg>
                    <span>Reportes</span>
                    @if($navActive('dashboard.orders'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                {{-- Sistema --}}
                <p class="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
                    Sistema
                </p>

                <a href="{{ tenant_route('dashboard.employees') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.employees') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.employees') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
                    </svg>
                    <span>Empleados</span>
                    @if($navActive('dashboard.employees'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

                <a href="{{ tenant_route('dashboard.settings') }}"
                   class="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                          {{ $navActive('dashboard.settings') ? 'text-white bg-brand-primary/15 border border-brand-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]' }}">
                    <svg class="w-4 h-4 shrink-0 {{ $navActive('dashboard.settings') ? 'text-brand-primary' : '' }}"
                         fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round"
                              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                    </svg>
                    <span>Ajustes</span>
                    @if($navActive('dashboard.settings'))
                        <span class="ml-auto w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                    @endif
                </a>

            </nav>

            {{-- Footer sidebar --}}
            <div class="px-3 py-4 border-t border-white/10">
                <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg group">
                    <span class="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/20 text-brand-primary-dark text-xs font-bold shrink-0 select-none">
                        {{ $userInitials }}
                    </span>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-white truncate">{{ $userName }}</p>
                        <p class="text-xs text-gray-500 truncate">{{ $userEmail }}</p>
                    </div>
                    <form method="POST" action="{{ route('logout') }}" class="shrink-0">
                        @csrf
                        <button type="submit"
                                class="p-1 rounded text-gray-500 hover:text-brand-primary transition-colors"
                                title="Cerrar sesión">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/>
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

        </aside>

        {{-- Overlay mobile --}}
        <div
            id="sidebar-overlay"
            class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm hidden lg:hidden"
            onclick="toggleSidebar()"
        ></div>

        {{-- ──────────────────────────────────────────────
             ÁREA PRINCIPAL
        ────────────────────────────────────────────── --}}
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

            {{-- TOPBAR --}}
            <header class="shrink-0 h-16 bg-brand-base/95 border-b border-brand-blush-light/80 flex items-center px-4 lg:px-6 gap-4 shadow-[0_4px_24px_-8px_rgba(29,31,36,0.06)]">

                {{-- Hamburger mobile --}}
                <button
                    onclick="toggleSidebar()"
                    class="lg:hidden p-2 rounded-lg text-brand-ink-muted hover:text-brand-ink hover:bg-brand-warm transition-colors"
                    aria-label="Abrir menú"
                >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                    </svg>
                </button>

                {{-- Título + breadcrumb --}}
                <div class="flex-1 min-w-0">
                    <h1 class="font-serif text-xl font-semibold text-brand-ink truncate leading-tight">
                        @hasSection('pageTitle')
                            @yield('pageTitle')
                        @else
                            {{ $pageTitle }}
                        @endif
                    </h1>
                    @hasSection('breadcrumbs')
                        <nav class="flex items-center gap-1.5 mt-0.5 text-xs text-brand-ink-muted" aria-label="Breadcrumb">
                            @yield('breadcrumbs')
                        </nav>
                    @endif
                </div>

                {{-- Acciones del topbar --}}
                <div class="flex items-center gap-2 shrink-0">

                    @hasSection('topbarActions')
                        <div class="flex items-center gap-2">@yield('topbarActions')</div>
                        <span class="w-px h-6 bg-brand-blush-light/80"></span>
                    @endif

                    {{-- Notificaciones --}}
                    <button class="relative p-2 rounded-lg text-brand-ink-muted hover:text-brand-ink hover:bg-brand-warm transition-colors"
                            aria-label="Notificaciones">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
                        </svg>
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary ring-2 ring-brand-base"></span>
                    </button>

                    <span class="w-px h-6 bg-brand-blush-light/80"></span>

                    {{-- Menú usuario (Alpine.js) --}}
                    <div class="relative" x-data="{ open: false }" @click.outside="open = false">

                        <button
                            @click="open = !open"
                            class="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-lg hover:bg-brand-warm transition-colors"
                        >
                            <span class="flex items-center justify-center w-8 h-8 rounded-full
                                         bg-brand-primary/20 text-brand-primary-dark text-xs font-bold select-none shrink-0">
                                {{ $userInitials }}
                            </span>
                            <div class="hidden sm:block min-w-0">
                                <p class="text-sm font-medium text-brand-ink leading-none truncate max-w-[130px]">{{ $userName }}</p>
                                <p class="text-xs text-brand-ink-muted leading-none mt-0.5">Admin</p>
                            </div>
                            <svg class="w-3.5 h-3.5 text-brand-ink-muted shrink-0 transition-transform duration-200"
                                 :class="open ? 'rotate-180' : ''"
                                 fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
                            </svg>
                        </button>

                        <div
                            x-show="open"
                            x-cloak
                            x-transition:enter="transition ease-out duration-150"
                            x-transition:enter-start="opacity-0 scale-95 -translate-y-1"
                            x-transition:enter-end="opacity-100 scale-100 translate-y-0"
                            x-transition:leave="transition ease-in duration-100"
                            x-transition:leave-start="opacity-100 scale-100"
                            x-transition:leave-end="opacity-0 scale-95"
                            class="absolute right-0 top-full mt-2 w-52
                                   bg-brand-base rounded-xl shadow-lg border border-brand-blush-light/80
                                   py-1 z-50 origin-top-right"
                        >
                            <div class="px-4 py-2.5 border-b border-brand-blush-light/60">
                                <p class="text-sm font-medium text-brand-ink">{{ $userName }}</p>
                                <p class="text-xs text-brand-ink-muted truncate">{{ $userEmail }}</p>
                            </div>
                            <a href="{{ tenant_route('dashboard.settings') }}"
                               class="flex items-center gap-2.5 px-4 py-2 text-sm text-brand-ink-muted hover:bg-brand-warm hover:text-brand-ink transition-colors">
                                <svg class="w-4 h-4 text-brand-ink-muted" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                                </svg>
                                Ajustes del salón
                            </a>
                            <div class="border-t border-brand-blush-light/60 mt-1 pt-1">
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit"
                                            class="w-full flex items-center gap-2.5 px-4 py-2 text-sm
                                                   text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"/>
                                        </svg>
                                        Cerrar sesión
                                    </button>
                                </form>
                            </div>
                        </div>

                    </div>

                </div>
            </header>
            {{-- FIN TOPBAR --}}

            {{-- CONTENIDO PRINCIPAL --}}
            <main class="flex-1 overflow-y-auto">
                <div class="p-4 lg:p-8 max-w-screen-2xl mx-auto">
                    @yield('content')
                </div>
            </main>

        </div>

    </div>
    {{-- FIN WRAPPER --}}

    {{-- Toggle sidebar mobile --}}
    <script>
        function toggleSidebar() {
            const sidebar  = document.getElementById('sidebar');
            const overlay  = document.getElementById('sidebar-overlay');
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    </script>

    {{-- Livewire + Alpine vía Vite (dashboard.js); los stacks después para no ejecutar scripts antes de Livewire.start() --}}
    @vite(['resources/js/dashboard.js'])
    @stack('js')
    @stack('scripts')
</body>
</html>
