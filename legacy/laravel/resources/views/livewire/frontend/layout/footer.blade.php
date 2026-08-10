<footer id="footer" class="page-section dark border-0 p-0 clearfix" style="background-color: #{{ $setting->footer_background_color }}; color: #{{ $setting->footer_text_color }}">

    <div class="container clearfix">
        <!-- Footer Widgets
        ============================================= -->
        <div class="footer-widgets-wrap clearfix">

            <div class="row col-mb-50">
                <div class="col-sm-12 col-md-4 col-lg-4">
                    <div class="footer-logo">
                        <img src="{{ asset($this->small('storage/logo/', $setting->logo)) }}" width="128px" alt="Image" loading="lazy">

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
