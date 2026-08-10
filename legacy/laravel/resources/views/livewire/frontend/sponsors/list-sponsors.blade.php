<div>
    @if ($sponsors->isNotEmpty())
        <div>
            <div id="oc-clients" class="owl-carousel owl-carousel-full image-carousel carousel-widget topmargin-lg mb-0"
                data-margin="0" data-nav="false" data-pagi="false" data-autoplay="3000" data-items-xs="3"
                data-items-sm="3" data-items-md="5" data-items-lg="6" data-items-xl="6" data-loop="true"
                style="z-index: 2; padding: 30px 0; border-top: 1px solid rgba(255,255,255,0.15);">
                @foreach ($sponsors as $sponsor)
                    <div class="oc-item">
                        <a href="javascript:void(0)" title="{{ $sponsor->name }}">
                            <img src="{{ asset($this->medium('storage/sponsors/', $sponsor->image)) }}"
                                alt="{{ $sponsor->name }}" loading="lazy">
                        </a>
                    </div>
                @endforeach
            </div>
        </div>
    @endif
</div>
