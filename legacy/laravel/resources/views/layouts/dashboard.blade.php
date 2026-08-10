<!DOCTYPE html><!--
    * CoreUI - Free Bootstrap Admin Template
    * @version v4.2.2
    * @link https://coreui.io/product/free-bootstrap-admin-template/
    * Copyright (c) 2023 creativeLabs Łukasz Holeczek
    * Licensed under MIT (https://github.com/coreui/coreui-free-bootstrap-admin-template/blob/main/LICENSE)
    -->
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <base href="./">
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <meta name="description" content="CoreUI - Open Source Bootstrap Admin Template">
    <meta name="author" content="Łukasz Holeczek">
    <meta name="keyword" content="Bootstrap,Admin,Template,Open,Source,jQuery,CSS,HTML,RWD,Dashboard">
    <title>{{ isset($title) ? $title : __('app.meta.admin_default') }}</title>
    <x-favicon-links />
    <meta name="theme-color" content="#FFFDF8">
    <meta name="msapplication-TileColor" content="#8F3D3D">
    <meta name="msapplication-TileImage" content="{{ asset('images/apple-touch-icon.png') }}">
    <!-- Vendors styles-->
    <!--<link rel="stylesheet" href="{{ asset('coreui/vendors/simplebar/css/simplebar.css') }}">-->
    <link rel="stylesheet" href="{{ asset('coreui/css/vendors/simplebar.css') }}">
    <!-- Main styles for this application-->
    <link href="{{ asset('coreui/css/style.css') }}" rel="stylesheet">
    <!-- We use those styles to show code examples, you should remove them in your application.-->
    <link href="{{ asset('coreui/css/examples.css') }}" rel="stylesheet">
    <link href="{{ asset('coreui/vendors/@coreui/icons/css/free.min.css') }}" rel="stylesheet">
    <link href="{{ asset('coreui/css/custom.css') }}" rel="stylesheet">
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=cormorant-garamond:500,600,700|dm-sans:400,500,600,700&display=swap" rel="stylesheet" />
    @vite(['resources/css/dashboard.css'])
    @stack('css')
    @livewireStyles
</head>

@php
    $routeName = request()->route()?->getName() ?? '';
    $navActive = fn (string $base): bool => $routeName === $base || $routeName === $base.'.local';
    $salonLabel = \App\Models\Setting::query()->first()?->company_name;
@endphp

<body class="shearly-dashboard">
    @php
        $demoBannerText = \Illuminate\Support\Facades\Lang::has('app.demo.banner') ? __('app.demo.banner') : 'Estás usando una cuenta demo.';
        $demoBannerCta = \Illuminate\Support\Facades\Lang::has('app.demo.cta_create_salon') ? __('app.demo.cta_create_salon') : 'Crear mi salón';
    @endphp
    @if(\App\Models\Tenant::current()?->isDemo())
    <div class="shearly-demo-banner py-2 px-4" role="status">
        <span class="font-medium">{{ $demoBannerText }}</span>
        <span class="mx-2 text-brand-ink-muted">·</span>
        <a href="{{ route('register.salon') }}" wire:navigate class="font-semibold text-shearly-800 underline decoration-shearly-300/70 underline-offset-2 hover:text-shearly-900">{{ $demoBannerCta }}</a>
    </div>
    @endif
    <div class="sidebar sidebar-fixed sidebar-lg shearly-sidebar" id="sidebar">
        <div class="sidebar-brand d-none d-md-flex flex-column align-items-start px-3 py-4 gap-2">
            <a href="{{ tenant_url('/dashboard') }}" wire:navigate class="d-flex align-items-center gap-2 text-decoration-none text-brand-ink shearly-brand-link">
                <x-shearly-logo class="w-9 h-9 shrink-0" />
                <span class="font-serif fs-4 fw-semibold lh-1 tracking-tight">Shearly</span>
            </a>
            @if($salonLabel)
                <span class="small text-truncate w-100 ps-1 shearly-salon-label" style="max-width: 12rem;">{{ $salonLabel }}</span>
            @endif
        </div>
        <ul class="sidebar-nav" data-coreui="navigation" data-simplebar="">

            <li class="nav-title">{{ __('app.dashboard.menu') }}</li>

            <!-- home -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard')]) href="{{ tenant_url('/dashboard') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-home') }}"></use>
                    </svg>
                    {{ __('app.dashboard.home') }}
                </a>
            </li>

            <!-- calendar -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard.calendar')]) href="{{ tenant_url('/dashboard/calendar') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-calendar') }}"></use>
                    </svg>
                    {{ __('app.dashboard.calendar') }}
                </a>
            </li>

            <!-- board -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard.board')]) href="{{ tenant_url('/dashboard/board') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-speedometer') }}"></use>
                    </svg>
                    {{ __('app.dashboard.board') }}
                </a>
            </li>

            <!-- employees -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard.employees')]) href="{{ tenant_url('/dashboard/employees') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-user') }}"></use>
                    </svg>
                    {{ __('app.dashboard.employees') }}
                </a>
            </li>

            <!-- users -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard.users')]) href="{{ tenant_url('/dashboard/users') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-people') }}"></use>
                    </svg>
                    {{ __('app.dashboard.users') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                </a>
            </li>

            <li class="nav-group">
                <a class="nav-link nav-group-toggle" href="#">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-notes') }}"></use>
                    </svg>
                    {{ __('app.dashboard.schedule_group') }}
                </a>
                <ul class="nav-group-items">

                    <!-- create-appointment -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.appointments.create')]) href="{{ tenant_url('/dashboard/appointments/create') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-plus') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.new_appointment') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                    <!-- appointments -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.appointments')]) href="{{ tenant_url('/dashboard/appointments') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-list') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.list_appointments') }}
                        </a>
                    </li>

                </ul>
            </li>

            <!-- orders -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('dashboard.orders')]) href="{{ tenant_url('/dashboard/orders') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-calculator') }}"></use>
                    </svg>
                    {{ __('app.dashboard.tickets') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                </a>
            </li>


            <li class="nav-group">
                <a class="nav-link nav-group-toggle" href="#">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-border-all') }}"></use>
                    </svg>
                    {{ __('app.dashboard.items_group') }}
                </a>
                <ul class="nav-group-items">

                    <!-- item.create -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.items.create')]) href="{{ tenant_url('/dashboard/items/create') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-plus') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.new_item') }}
                        </a>
                    </li>

                    <!-- item.create -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.categories')]) href="{{ tenant_url('/dashboard/categories') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-clone') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.categories') }}
                        </a>
                    </li>

                    <!-- products -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.products')]) href="{{ tenant_url('/dashboard/products') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-tags') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.products') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                     <!-- services -->
                     <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.services')]) href="{{ tenant_url('/dashboard/services') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-apps') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.services') }}
                        </a>
                    </li>

                </ul>
            </li>

            <!-- billing -->
            <li class="nav-item">
                <a @class(['nav-link', 'active' => $navActive('billing')]) href="{{ tenant_url('/billing') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-credit-card') }}"></use>
                    </svg>
                    {{ __('app.dashboard.billing') }}
                </a>
            </li>

            <li class="nav-group">
                <a class="nav-link nav-group-toggle" href="#">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-screen-desktop') }}"></use>
                    </svg>
                    {{ __('app.dashboard.landing_group') }}
                </a>
                <ul class="nav-group-items">

                    <!-- config -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.settings')]) href="{{ tenant_url('/dashboard/settings') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-settings') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.settings') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                    <!-- styles -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.sections')]) href="{{ tenant_url('/dashboard/sections') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-color-palette') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.styles') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                    <!-- config images -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.settings.images')]) href="{{ tenant_url('/dashboard/settings_images') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-image') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.images') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                    <!-- instagram -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.instagram_feeds')]) href="{{ tenant_url('/dashboard/instagram_feeds') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/brand.svg#cib-instagram') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.instagram') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>

                    <!-- sponsors -->
                    <li class="nav-item ms-2">
                        <a @class(['nav-link', 'active' => $navActive('dashboard.sponsors')]) href="{{ tenant_url('/dashboard/sponsors') }}">
                            <svg class="nav-icon">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-fire') }}">
                                </use>
                            </svg>
                            {{ __('app.dashboard.sponsors') }} <!--<span class="badge badge-sm bg-danger ms-auto">PRO</span>-->
                        </a>
                    </li>
                </ul>
            </li>

            <li class="nav-item mt-auto shearly-sidebar-site-link-wrap">
                <a class="nav-link shearly-sidebar-site-link" href="{{ route('welcome') }}">
                    <svg class="nav-icon">
                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-screen-smartphone') }}">
                        </use>
                    </svg>
                    {{ __('app.dashboard.open_website') }}
                    <svg class="nav-icon ms-auto opacity-75" aria-hidden="true"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-external-link') }}"></use></svg>
                </a>
            </li>
        </ul>

        <button class="sidebar-toggler" type="button" data-coreui-toggle="unfoldable"></button>
    </div>
    <div class="wrapper d-flex flex-column min-vh-100 shearly-dashboard-shell flex-grow-1">
        <header class="header header-sticky mb-0 border-0 shadow-none shearly-header-main">
            <div class="container-fluid pt-4 pb-3">
                <div class="shearly-topbar d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div class="d-flex align-items-center gap-3 min-w-0 flex-grow-1 flex-shrink-1">
                        <button class="header-toggler btn btn-link text-brand-ink p-0 px-md-0 me-md-1" type="button" onclick="coreui.Sidebar.getInstance(document.querySelector('#sidebar')).toggle()" aria-label="Menu">
                            <svg class="icon icon-lg text-brand-ink">
                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-menu') }}"></use>
                            </svg>
                        </button>
                        <a class="header-brand d-md-none d-flex align-items-center gap-2 text-decoration-none" href="{{ tenant_url('/dashboard') }}">
                            <x-shearly-logo class="w-8 h-8 text-shearly-800" />
                            <span class="font-serif fs-5 fw-semibold text-brand-ink">Shearly</span>
                        </a>
                        <div class="d-none d-md-block min-w-0">
                            <h1 class="shearly-topbar-title h5">{{ $title ?? __('app.dashboard.home') }}</h1>
                            @if($salonLabel)
                                <p class="mb-0 small text-brand-ink-muted text-truncate d-none d-lg-block shearly-topbar-subtitle" style="max-width: 20rem;">{{ $salonLabel }}</p>
                            @endif
                        </div>
                    </div>
                    <div class="d-flex align-items-center justify-content-end gap-2 gap-sm-3 flex-shrink-0 ms-auto">
                        <a href="{{ tenant_url('/dashboard/orders') }}" class="btn btn-primary btn-sm d-none d-lg-inline-flex align-items-center gap-2 shearly-topbar-cta">
                            <svg class="icon"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-plus') }}"></use></svg>
                            <span>{{ __('app.dashboard.tickets') }}</span>
                        </a>
                        <x-language-switch variant="dashboard" class="shrink-0" />
                        <div class="dropdown">
                            <a class="d-flex align-items-center gap-2 text-decoration-none text-brand-ink py-1 px-2 rounded-3 hover:bg-brand-mist/50 transition-colors" data-coreui-toggle="dropdown" href="#" role="button" aria-expanded="false">
                                @if(Auth::user()->image && \Illuminate\Support\Facades\Storage::disk('public')->exists('users/'.Auth::user()->image))
                                    <div class="avatar avatar-md rounded-circle overflow-hidden border border-brand-blush-light/80 shadow-sm">
                                        <img class="avatar-img" src="{{ asset('storage/users/' . Auth::user()->image) }}" alt="">
                                    </div>
                                @else
                                    <div class="rounded-circle d-flex align-items-center justify-content-center fw-semibold text-shearly-800 border border-brand-blush-light bg-brand-blush-light/50 shadow-sm" style="width:40px;height:40px;font-size:0.95rem;">
                                        {{ strtoupper(\Illuminate\Support\Str::substr(Auth::user()->name, 0, 1)) }}
                                    </div>
                                @endif
                                <div class="d-none d-sm-block text-start lh-sm">
                                    <div class="small fw-semibold text-brand-ink text-truncate" style="max-width: 10rem;">{{ Auth::user()->name }}</div>
                                    <div class="text-muted" style="font-size: 0.7rem;">{{ Auth::user()->getRoleNames()->first() ?? '' }}</div>
                                </div>
                            </a>
                            <div class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 py-2 mt-1">
                                <div class="px-3 py-2 border-bottom border-light small text-brand-ink-muted">{{ __('app.dashboard.settings_header') }}</div>
                                <a class="dropdown-item rounded-2 py-2" href="{{ tenant_url('/profile') }}">
                                    <svg class="icon me-2 text-brand-ink-muted"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-user') }}"></use></svg>
                                    {{ __('app.dashboard.my_account') }}
                                </a>
                                <div class="dropdown-divider my-1"></div>
                                <a class="dropdown-item rounded-2 py-2 text-shearly-800" href="{{ route('logout') }}">
                                    <svg class="icon me-2"><use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-account-logout') }}"></use></svg>
                                    {{ __('app.dashboard.logout') }}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            @if(!in_array(request()->route()?->getName(), ['dashboard', 'dashboard.local']))
            <div class="container-fluid pb-3 pt-0">
                <nav aria-label="breadcrumb" class="pt-2">
                    <ol class="breadcrumb my-0 small shearly-breadcrumb-wrap">
                        <li class="breadcrumb-item"><a class="text-decoration-none text-shearly-700" href="{{ tenant_url('/dashboard') }}">{{ __('app.dashboard.breadcrumb_home') }}</a></li>
                        @yield('nav-content')
                    </ol>
                </nav>
                @yield('button-in-tab')
            </div>
            @else
            <div class="container-fluid pb-2">
                @yield('button-in-tab')
            </div>
            @endif
        </header>

        <div class="body flex-grow-1 px-4 pb-5">
            <div class="container-fluid pt-5 pb-5 shearly-main-container">
                <div class="shearly-page-stack">
                    <livewire:dashboard.onboarding-checklist />
                    @yield('content')
                </div>
            </div>
        </div>

        <footer class="footer border-top border-gray-100 bg-white mt-auto py-3 small text-brand-textMuted">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3">
                <div>
                    <span class="font-serif fw-semibold text-brand-ink">Shearly</span>
                    <span class="mx-1">·</span>
                    <span>© {{ date('Y') }}</span>
                </div>
                <div>
                    {{ __('app.dashboard.footer_dev') }}
                    <a href="https://blessingstar.com" target="_blank" rel="noopener" class="text-shearly-800 fw-medium text-decoration-none hover-underline">
                        {{ __('app.dashboard.footer_company') }}
                    </a>
                </div>
            </div>
        </footer>

        <!-- templates -->
        <div class="toast-container position-fixed top-0 end-0 p-3">
            @include('partials.toast-notification')
        </div>
        <!-- end-templates -->

    </div>
    <!-- CoreUI and necessary plugins-->
    <script src="{{ asset('coreui/vendors/@coreui/coreui/js/coreui.bundle.min.js') }}"></script>
    <!-- Plugins and scripts required by this view-->
    <!--<script src="{{ asset('coreui/vendors/@coreui/utils/js/coreui-utils.js') }}"></script>-->
    <!--<script src="{{ asset('coreui/js/main.js') }}"></script>-->

    <!-- toasts -->
    <!--<script src="{{ asset('coreui/js/toasts.js') }}"></script>-->

    <script src="{{ asset('coreui/js/toasts-init.js') }}"></script>

    <script src="{{ asset('coreui/js/tooltips.js') }}"></script>

    <script>
        /*window.addEventListener('openModal', event => {

                    const modalElement = document.getElementById(event.detail.modal);
                    console.log(modalElement)
                    if (modalElement) {
                        modalElement.classList.add('show');
                        modalElement.style.display = 'block';
                    }
                });*/
    </script>

    <script>
        window.addEventListener('closeModal', event => {
            var modal = event.detail[0].modal;
            document.getElementById(modal).style.display = "none";
            document.querySelector('.modal-backdrop').remove();
        });
    </script>

    @stack('js')
    @livewireScripts
</body>

</html>
