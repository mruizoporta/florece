<section id="slider" class="slider-element slider-parallax page-section include-header @if(request()->is('/'))  min-vh-60 min-vh-md-100 @else  min-vh-40 min-vh-md-30 @endif">
    <div class="slider-inner" style="background: url('{{ asset('storage/banners/1920/' . $banner) }}') center center no-repeat; background-size: cover;">

        <div class="vertical-middle">
            <div class="text-center py-5 py-md-0">

                <!-- Slider Navigation
                ============================================= -->
                <nav class="custom-hero-nav py-3 pt-5" style="background-color: rgba(0, 0, 0, 0.7)">
                    <ul class="one-page-menu" data-easing="easeInOutExpo" data-speed="1300" data-offset="60">
                        @auth
                            @if(auth()->user()->hasRole('Admin'))
                                <li>
                                    <a href="{{ tenant_url('/dashboard') }}" style="color: #FF6464">Panel administrativo</a>
                                </li>
                            @endif
                        @endauth
                        <li>
                            <a href="{{ tenant_url('/') }}">Inicio</a>
                        </li>
                        <li><a href="#" data-offset="56" data-href="#sobre-nosotros">Sobre nosotros</a></li>
                        <li><a href="#" data-href="#servicios">Servicios</a></li>
                        <li><a href="#" data-href="#productos">Productos</a></li>
                        <li><a href="#" data-href="#instagram">Instagram</a></li>
                    </ul>
                </nav>
            </div>
        </div>

        <div class="video-wrap">
            <div class="video-overlay" style="background: rgba(0,0,0,0.3);"></div>
        </div>

        <!-- Slider Appointment Button
        ============================================= -->
        <a href="{{ tenant_url('/nueva-agenda') }}" class="button button-large button-color button-appointment d-none d-lg-block" style="background-color: #{{ $buttons_background_color }}; color: #{{ $buttons_text_color }}">
            <i class="icon-calendar1"></i>
            Agendarme
        </a>

    </div>
</section>
