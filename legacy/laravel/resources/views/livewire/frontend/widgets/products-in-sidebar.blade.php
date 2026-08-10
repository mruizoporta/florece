<div class="widget clearfix">

    @if($products->isNotEmpty())
        <h4>Te podrá interesar</h4>

        <div class="posts-sm row col-mb-30">

            @foreach($products as $product)
            <div class="entry col-12">
                <div class="grid-inner row g-0">
                    <div class="col-auto">
                        <div class="entry-image">
                            <a href="{{ route('products.show', $product->item->slug) }}">
                                <img src="{{ asset($this->verySmall('storage/items/', $product->item->image)) }}" alt="Image" loading="lazy">
                            </a>
                        </div>
                    </div>
                    <div class="col ps-3">
                        <div class="entry-title">
                            <h4>
                                <a href="{{ route('products.show', $product->item->slug) }}">
                                    {{ $product->item->name }}
                                </a>
                            </h4>
                        </div>
                        <div class="entry-meta no-separator">
                            <ul>
                                <li class="color">
                                    {{ $product->item->price_formatted }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            @endforeach

        </div>
    @endif

</div>
