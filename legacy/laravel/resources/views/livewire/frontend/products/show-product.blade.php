<div class="modal fade" id="modalShowProduct" tabindex="-1" aria-labelledby="myLargeModalLabel" style="display: none;"
    aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">

            <div class="modal-header">
                <button type="button" class="btn-close btn-sm" data-bs-dismiss="modal" aria-hidden="true"></button>
            </div>

            @if ($product)
                <div class="modal-body">

                    <section id="content">
                        <div class="content-wrap">
                            <div class="container clearfix">

                                <div class="single-product">
                                    <div class="product">
                                        <div class="row gutter-40">

                                            <div class="col-md-6">

                                                <!-- Product Single - Gallery
                                            ============================================= -->

                                                <div id="carouselExampleIndicators" class="carousel slide carousel-hammer" data-bs-ride="true">
                                                    <div class="carousel-indicators">

                                                        <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>

                                                        @foreach($product->images as $key => $image)
                                                        <button type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide-to="{{ ++$key }}" aria-label="Slide {{ ++$key }}"></button>
                                                        @endforeach

                                                    </div>

                                                    <div class="carousel-inner">

                                                    <!-- item-image -->
                                                    <div class="carousel-item active">
                                                        <img src="{{ asset($this->medium('storage/items/', $product->item->image)) }}" class="d-block w-100" style="height: 100%;" alt="...">
                                                    </div>

                                                    @foreach($product->images as $image)
                                                        <div class="carousel-item">
                                                            <img src="{{ asset($this->large('storage/items/', $image->image)) }}" class="d-block w-100" style="height: 100%;" alt="...">
                                                        </div>
                                                    @endforeach

                                                    </div>

                                                    <button class="carousel-control-prev" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="prev">
                                                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                                                        <span class="visually-hidden">Previous</span>
                                                    </button>
                                                    <button class="carousel-control-next" type="button" data-bs-target="#carouselExampleIndicators" data-bs-slide="next">
                                                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                                                        <span class="visually-hidden">Next</span>
                                                    </button>
                                                </div>

                                            </div>

                                            <div class="col-md-6 product-desc">

                                                <div class="d-flex align-items-center justify-content-between">

                                                    <!-- Product Single - Price
                                                ============================================= -->
                                                    <div class="product-price">
                                                        <ins>{{ $product->item->price_formatted }}</ins>
                                                    </div><!-- Product Single - Price End -->

                                                </div>

                                                <div class="line"></div>

                                                <!-- Product Single - Short Description
                                            ============================================= -->
                                                <h3>{{ $product->item->name }}</h3>
                                                <p>{{ $product->item->description }}</p>

                                                <ul class="iconlist">
                                                    <li>
                                                        <i class="icon-caret-right"></i>Disponibilidad:
                                                        @if ($product->stock == 0)
                                                            Sin stock
                                                        @elseif($product->stock == 1)
                                                            {{ $product->stock }} unidad
                                                        @else
                                                            {{ $product->stock }} unidades
                                                        @endif
                                                    </li>

                                                    <li>
                                                        <i class="icon-caret-right"></i>Categoría:
                                                        {{ $product->item->category->name }}
                                                    </li>
                                                </ul>

                                                <!-- Product Single - Share
                                            ============================================= -->
                                                <div
                                                    class="si-share border-0 d-flex justify-content-between align-items-center mt-4">
                                                    <span>Compartir:</span>
                                                    <div>
                                                        <a href="https://api.whatsapp.com/send?text=texto_codificado" target="_blank" class="social-icon si-borderless si-whatsapp">
                                                            <i class="icon-whatsapp"></i>
                                                            <i class="icon-whatsapp"></i>
                                                        </a>
                                                        <a href="#" class="social-icon si-borderless si-facebook">
                                                            <i class="icon-facebook"></i>
                                                            <i class="icon-facebook"></i>
                                                        </a>
                                                    </div>

                                                </div><!-- Product Single - Share End -->

                                                <div class="mt-5">
                                                    <p class="lead">
                                                        ¿Tienes alguna duda de éste producto?
                                                    </p>
                                                    <a href="https://wa.me/+{{ $whatsapp }}?text=Deseo%20consultar%20por%20el%20producto%20*{{ $product->item->name }}*."
                                                        target="_blank" class="button button-circle"
                                                        style="background-color: #128c7e">
                                                        <i class="icon-whatsapp"></i>
                                                        Consultar
                                                    </a>
                                                </div>

                                            </div>

                                            <div class="w-100"></div>

                                            <div class="col-12 mt-5">

                                                <div class="tabs clearfix mb-0" id="tab-1">

                                                    <ul class="tab-nav clearfix">
                                                        <li>
                                                            <a href="#tabs-1">
                                                                <i class="icon-info-sign"></i>
                                                                <span class="d-none d-md-inline-block">
                                                                    Detalles
                                                                </span>
                                                            </a>
                                                        </li>
                                                    </ul>

                                                    <div class="tab-container">

                                                        <div class="tab-content clearfix" id="tabs-1">
                                                            <div class="container mx-5">
                                                                <p>{!! $product->long_description !!}</p>
                                                            </div>
                                                        </div>


                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </section><!-- #content end -->
                </div>
            @endif
        </div>
    </div>
</div>
