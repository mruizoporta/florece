<div>

    <!-- about_us -->
    <div id="sobre-nosotros">
        @if($section->about_us_show_section)
        <livewire:frontend.layout.about_us
            :image_left="$setting->image_left"
            :icons_color="$setting->icons_color"
            :about_us="$setting->about_us"
            :image_right="$setting->image_right"
            :about_us_text="$section->about_us_text"
            :about_us_icon="$section->about_us_icon"
        />
    @endif
    </div>

    <!-- employees -->
    @if($section->employees_show_section)
    <div class="section bg-transparent mb-0 topmargin-sm clearfix">

        <div class="container clearfix">

            <div class="heading-block center">
                <i class="{{ $section->employees_icon }}" style="color: #{{ $setting->icons_color }}"></i>
                <h3 class="ls2">{{ $section->employees_text }}</h3>
            </div>

            <livewire:frontend.employees.list-employees :titles_color="$setting->titles_color" />

        </div>

    </div>
    @endif

    <!-- services -->
    @if($section->services_show_section)
    <div id="servicios" class="section page-section parallax pb-0 mb-0 dark" style="background-image: url('{{ asset($this->extraLarge('storage/landing/', $setting->image_parallax)) }}'); background-size: cover; height: 600px" data-bottom-top="background-position:0px 0px;" data-top-bottom="background-position:0px -300px;"></div>

    <div class="container bottommargin dark clearfix" style="margin-top: -500px">
        <div class="heading-block bottommargin-lg center clearfix">

        <div class="py-4" style="background-color: rgba(0, 0, 0, 0.7)">
                <i class="{{ $section->services_icon }}" style="color: #{{ $setting->icons_color }}"></i>
                <h2>{{ $section->services_text }}</h2>
            </div>
        </div>


        <livewire:frontend.services.list-services
            :currency_symbol="$setting->currency_symbol"
            :titles_color="$setting->titles_color"
            :buttons_background_color="$setting->buttons_background_color"
            :buttons_text_color="$setting->buttons_text_color"
        />

    </div>
    @endif

    <!-- products -->
    @if($section->products_show_section)
    <div id="productos" class="section m-0 page-section bg-transparent">

        <div class="container">
            <div class="heading-block center">
                <i class="{{ $section->products_icon }}" style="color: #{{ $setting->icons_color }}"></i>
                <h2>{{ $section->products_text }}</h2>
            </div>

            <livewire:frontend.products.list-products :currency_symbol="$setting->currency_symbol" />
        </div>

        <livewire:frontend.products.show-product
            :currency_symbol="$setting->whatsapp"
        />

    </div>
    @endif

    <!-- instagram -->
    @if($section->instagram_show_section)
    <div id="instagram" class="section border-top-0 m-0">
        <div class="container text-center">

            <div class="heading-block center">
                <h2>{{ $section->instagram_text }}</h2>
                <span>
                    <a href="{{ $setting->instagram_href }}" target="_blank" class="my-0 me-0 ms-2 inline-block si-small si-borderless" style="font-size: 1.5em">
                        <i class="{{ $section->instagram_icon }}" style="color: #{{ $setting->icons_color }}"></i>
                    </a>
                </span>
            </div>
        <livewire:frontend.instagram.list-instagram :instagram_href="$setting->instagram_href" />
        </div>
    </div>
    @endif

    @if($section->whatsapp_show_section)
    <div class="section mb-0 bg-transparent">
        <div class="container">

            <div class="row justify-content-center text-center">

                <!-- Heading Title
                ============================================= -->
                <div class="col-sm-12 col-md-12 col-lg-6">
                    <small class="text-muted text-uppercase fw-light ls3 d-block">{{ $section->whatsapp_title_1 }}</small>
                    <h2 class="fw-bold ls0 mb-3" style="font-size: 2em; line-height: 1.2">{{ $section->whatsapp_title_2 }}</h2>
                    <p class="text-muted" style="font-size: 16px;">{{ $section->whatsapp_title_3 }}</p>
                    <div class="lign-items-center mt-4 pull-center">
                        <a href="https://wa.me/+{{ $setting->whatsapp }}" target="_blank" class="button button-change button-large button-rounded nott fw-light m-0 overflow-hidden" style="background-color: #{{ $setting->btn_whatsapp_background_color }}; color: #{{ $setting->btn_whatsapp_text_color }}">
                            <span><i class="{{ $section->whatsapp_icon }}"></i> {{ $section->btn_whatsapp_button_text }}</span>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </div>
    @endif

    @section('footer')
        @include('livewire.frontend.layout.footer')
    @endsection
</div>
