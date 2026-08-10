<div class="row col-mb-50 mb-0">

    @foreach ($products as $product)
        <div class="col-lg-3 col-md-6">
            <div class="product">
                <div class="product-image">
                    <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modalShowProduct" wire:click="showProduct({{ $product->id }})">
                        <img src="{{ asset($this->large('storage/items/', $product->item->image)) }}"
                            alt="{{ $product->item->name }}" width="300px" loading="lazy">
                    </a>
                </div>
                <div class="product-desc center">
                    <div class="product-price">
                        <ins>
                            {{ $currency_symbol }}
                            {{ $product->item->price }}
                        </ins>
                    </div>
                    <div class="product-title">
                        <h3>
                            <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modalShowProduct" wire:click="showProduct({{ $product->id }})">
                                {{ $product->item->name }}
                            </a>
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    @endforeach

</div>
