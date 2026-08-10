<!DOCTYPE html>
<html dir="ltr" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>

	<meta http-equiv="content-type" content="text/html; charset=utf-8" />
	<meta name="author" content="" />

	<!-- Stylesheets
	============================================= -->
	<link href="https://fonts.googleapis.com/css?family=PT+Sans+Caption:400,700|PT+Sans:400,700|PT+Serif:400,400i&display=swap" rel="stylesheet" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/bootstrap.css') }}" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/style.css') }}" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/dark.css') }}" type="text/css" />

	<!-- Barber Demo Specific Stylesheet -->
	<link rel="stylesheet" href="{{ asset('frontend/css/barber.css') }}" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/fonts.css') }}" type="text/css" />
	<!-- / -->

	<link rel="stylesheet" href="{{ asset('frontend/css/font-icons.css') }}" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/animate.css') }}" type="text/css" />
	<link rel="stylesheet" href="{{ asset('frontend/css/magnific-popup.css') }}" type="text/css" />

	<link rel="stylesheet" href="{{ asset('frontend/css/et-line.css') }}" type="text/css" />

	<link rel="stylesheet" href="{{ asset('frontend/css/custom.css') }}" type="text/css" />
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

	<link rel="stylesheet" href="{{ asset('frontend/css/colors.php?color=5DADE2') }}" type="text/css" />

    <link href="{{ asset('coreui/vendors/@coreui/icons/css/free.min.css') }}" rel="stylesheet">


    @stack('css')
    @livewireStyles

	<!-- Document Title
	============================================= -->
	<title>{{ isset($title) ? $title : __('app.page.title.home') }}</title>

    <x-favicon-links />

    // LOAD SETTING (cached per tenant; shared across layout + Livewire)
    @php
        $section = $section ?? (\App\Support\TenantDataCache::section() ?? new \App\Models\Section);
        $setting = $setting ?? (\App\Support\TenantDataCache::setting() ?? new \App\Models\Setting);
    @endphp

	<style>
		/* Page Loading Style */
		.css3-spinner {height:100vh; -webkit-box-align:center; -ms-flex-align:center; align-items:center; display:-webkit-box; display:-ms-flexbox; display:flex; -webkit-box-pack:center; -ms-flex-pack:center; justify-content:center; background-color: #{{ $setting->footer_background_color }}; } @keyframes pulse {0% {opacity: 0; -webkit-transform: scale3d(.8, .8, .8); transform: scale3d(.8, .8, .8); } 50% { opacity: 1; } } .infinite.animated.pulse { -webkit-animation-duration: 1.7s; animation-duration: 1.7s; }
	</style>

</head>

<body class="stretched page-transition" style="background-color: #{{ $setting->footer_background_color }};" data-loader-html="<img class='infinite animated pulse' src='{{ asset('storage/logo/512/' . $setting->logo) }}' width='300'>">

	@if(\App\Models\Tenant::current()?->isDemo())
	<div class="alert alert-warning text-center rounded-0 mb-0 py-2 border-0" role="alert" style="border-radius: 0;">
		<span class="me-2">{{ __('app.demo.banner') }}</span>
		<a href="{{ route('register.salon') }}" class="alert-link fw-bold">{{ __('app.demo.cta_create_salon') }}</a>
	</div>
	@endif

	<!-- Document Wrapper
	============================================= -->
	<div id="wrapper" class="clearfix">

		<!-- Header
		============================================= -->
		<header id="header" class="transparent-header dark header-size-md" data-sticky-class="not-dark" data-sticky-offset="full" data-sticky-offset-negative="60" data-responsive-class="not-dark" data-sticky-shrink="false">
			<div id="header-wrap">
				<div class="container px-0">
					<div class="header-row">

						<div id="primary-menu-trigger">
							<svg class="svg-trigger" viewBox="0 0 100 100"><path d="m 30,33 h 40 c 3.722839,0 7.5,3.126468 7.5,8.578427 0,5.451959 -2.727029,8.421573 -7.5,8.421573 h -20"></path><path d="m 30,50 h 40"></path><path d="m 70,67 h -40 c 0,0 -7.5,-0.802118 -7.5,-8.365747 0,-7.563629 7.5,-8.634253 7.5,-8.634253 h 20"></path></svg>
						</div>

						<!-- Primary Navigation
						============================================= -->
						<nav class="primary-menu not-dark text-lg-center">

							<ul class="menu-container one-page-menu" data-easing="easeInOutExpo" data-speed="1300" data-offset="60">
                                @auth
                                    @if(auth()->user()->hasRole('Admin'))
                                        <li class="menu-item">
                                            <a class="menu-link" href="{{ tenant_url('/') }}" style="color: #FF6464">
                                                Panel administrativo
                                            </a>
                                        </li>
                                    @endif
                                @endauth
								<li class="menu-item active"><a class="menu-link" href="{{ tenant_url('/') }}" data-href="#wrapper">Inicio</a></li>
								<li class="menu-item"><a class="menu-link" href="#" data-offset="56" data-href="#sobre-nosotros">Sobre nosotros</a></li>
								<li class="menu-item"><a class="menu-link" href="#" data-href="#servicios">Servicios</a></li>
								<li class="menu-item"><a class="menu-link" href="#" data-href="#productos">Productos</a></li>
                                <li class="menu-item"><a class="menu-link" href="#" data-href="#instagram">Instagram</a></li>
								<li class="menu-item">
									<a href="{{ tenant_url('/nueva-agenda') }}" data-easing="easeInOutExpo" class="button button-color" style="background-color: #{{ $setting->buttons_background_color }}; color: #{{ $setting->buttons_text_color }}" >
                                        <i class="icon-calendar1"></i> Agendarme
                                    </a>
								</li>
                                @auth
                                    <li class="menu-item">
                                        <a href="{{ tenant_url('/mi-cuenta') }}" data-speed="1300" class="button button-color text-white">
                                            <i class="icon-user"></i> Mi cuenta
                                        </a>
                                    </li>
                                @else
                                    <li class="menu-item">
                                        <a href="{{ tenant_url('/login') }}" data-speed="1300" class="button button-color text-white">
                                            <i class="icon-user"></i> Iniciar sesión
                                        </a>
                                    </li>
                                @endauth

							</ul>

						</nav><!-- #primary-menu end -->

					</div>
				</div>
			</div>
			<div class="header-wrap-clone"></div>
		</header><!-- #header end -->

		<!-- Slider
		============================================= -->

		<livewire:frontend.layout.banner
            :banner="$setting->banner"
            :buttons_background_color="$setting->buttons_background_color"
            :buttons_text_color="$setting->buttons_text_color"
        />

		<!-- Content
		============================================= -->
		<section id="content" style="border-top: 8px solid #bf9456">

			<div class="content-wrap py-0">

				<!-- your content here -->
				@yield('content')

			</div>
		</section><!-- #content end -->


		<!-- Footer
		============================================= -->
		<footer id="footer" class="page-section dark border-0 p-0 clearfix" style="background-color: #{{ $setting->footer_background_color }}; color: #{{ $setting->footer_text_color }}">

            <div class="container clearfix">
                <!-- Footer Widgets
                ============================================= -->
                <div class="footer-widgets-wrap clearfix">

                    <div class="row col-mb-50">
                        <div class="col-sm-12 col-md-4 col-lg-4">
                            <div class="footer-logo">
                                <img src="{{ asset('storage/logo/128/' . $setting->logo) }}" width="128px" alt="Image" loading="lazy">

                                <p class="font-primary my-3">
                                    <i class="icon-clock-alt"></i>
                                    {{ $setting->schedules }}
                                </p>

                                <a href="{{ $setting->instagram_href }}" target="_blank" class="social-icon bg-transparent si-small si-light si-instagram">
                                    <i class="icon-instagram" style="color: #{{ $setting->footer_text_color }}"></i>
                                    <i class="icon-instagram" style="color: #{{ $setting->footer_text_color }}"></i>
                                </a>
                                <a href="https://wa.me/+{{ $setting->whatsapp }}" target="_blank" class="social-icon bg-transparent si-small si-light si-whatsapp">
                                    <i class="icon-whatsapp" style="color: #{{ $setting->footer_text_color }}"></i>
                                    <i class="icon-whatsapp" style="color: #{{ $setting->footer_text_color }}"></i>
                                </a>

                            </div>
                        </div>

                        <div class="col-sm-12 col-md-4 col-lg-4">
                            <div class="widget">
                                <h4 style="color: #{{ $setting->footer_text_color }}">Info</h4>
                                <div class="footer-content">
                                    <strong>Localidad:</strong> {{ $setting->location }}<br>
                                    <strong>Dirección:</strong> {{ $setting->address }}<br>
                                    <strong>Teléfono:</strong> {{ $setting->phone }}<br>
                                    <strong>Correo:</strong> {{ $setting->mail_contact }}
                                </div>
                            </div>
                        </div>

                        <div class="col-sm-12 col-md-4 col-lg-4">
                            <div class="widget">
                                <h4 style="color: #{{ $setting->footer_text_color }}">¿Cómo llegar?</h4>
                                <div class="footer-content">
                                    {!! $setting->embedded_content_map !!}
                                </div>

                            </div>
                        </div>

                    </div>

                </div>
            </div>

            <livewire:frontend.sponsors.list-sponsors />

            <hr>

            <!-- Copyrights
            ============================================= -->
            <div id="copyrights">
                <div class="container clearfix">

                    <div class="w-100 text-center">
                        <p class="my-3" style="color: #{{ $setting->footer_text_color }}">
                            {{ $setting->company_name }} &copy; {{ date('Y') }}
                        </p>
                    </div>

                </div>
            </div><!-- #copyrights end -->
        </footer><!-- #footer end -->

        <!-- templates -->
        <div class="toast-container position-fixed top-0 end-0 p-3">
            @include('partials.toast-notification')
        </div>
        <!-- end-templates -->

	</div><!-- #wrapper end -->

	<!-- Go To Top
	============================================= -->
	<div id="gotoTop" class="icon-angle-up"></div>

	<!-- JavaScripts
	============================================= -->
	<script src="{{ asset('frontend/js/jquery.js') }}"></script>
	<script src="{{ asset('frontend/js/plugins.min.js') }}"></script>

	<!-- Footer Scripts
	============================================= -->
	<script src="{{ asset('frontend/js/functions.js') }}"></script>

    <script src="{{ asset('coreui/vendors/@coreui/coreui/js/coreui.bundle.min.js') }}"></script>
    <script src="{{ asset('coreui/js/toasts-init.js') }}"></script>

    @stack('js')
    @livewireScripts

</body>
</html>
