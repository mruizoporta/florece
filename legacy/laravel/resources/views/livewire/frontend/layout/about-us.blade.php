<div id="about" class="section m-0 bg-transparent page-section mt-5 py-5">
    <div class="container clearfix">
        <div class="row clearfix">
            <div class="col-md-3 col-6 d-none d-md-block">
                <img src="{{ asset('storage/landing/300/' . $image_left) }}" alt="Image">
            </div>
            <div class="col-md-6 col-12 center" style="padding: 0 50px;">
                <i class="{{ $about_us_icon }}" style="color: #{{ $icons_color }}"></i>
                <div class="heading-block bottommargin-sm">
                    <h2>
                        {{ $about_us_text }}
                    </h2>
                </div>
                <p>
                    {{ $about_us }}
                </p>

            </div>
            <div class="col-md-3 col-6 d-none d-md-block">
                <img src="{{ asset('storage/landing/300/' . $image_right) }}" alt="Image">
            </div>
        </div>
    </div>
</div>
