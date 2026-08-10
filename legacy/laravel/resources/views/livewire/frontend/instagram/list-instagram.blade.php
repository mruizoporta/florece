<div id="oc-instagmram-feed" class="owl-carousel products-carousel carousel-widget" data-pagi="false" data-items-xs="1"
    data-items-sm="1" data-items-md="2" data-items-lg="3">

    @foreach ($instagram as $feed)
        <div class="oc-item">
            <div class="product">
                {!! $feed->content !!}
            </div>
        </div>
    @endforeach

</div>
