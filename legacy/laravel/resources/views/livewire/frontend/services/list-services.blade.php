<div class="row dark col-padding clearfix" style="background-color: #121212">

    @foreach($services as $service)
        <div class="col-lg-6 price-wrap">
            <div class="price-header">
                <div class="price-name">
                    <a href="javascript:void(0)" class="color">
                        <img class="avatar-img" src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}" width="32px" alt="{{ $service->item->name }}">
                        <span style="color: #{{ $titles_color }}">
                            {{ $service->item->name }}
                        </span>
                    </a>
                </div>
                <div class="price-dots">
                    <span class="separator-dots"></span>
                </div>
                <div class="price-price">
                    {{ $currency_symbol }}
                    {{ $service->item->price }}
                </div>
            </div>
            <p class="price-desc">{{ $service->item->description }}</p>
        </div>
    @endforeach

    <div class="col-12 center">
        <a href="#" class="button button-large button-color d-none d-lg-block" style="background-color: #{{ $buttons_background_color }}; color: #{{ $buttons_text_color }}">
            <i class="icon-calendar1"></i>
            Agendarme
        </a>
    </div>
</div>
