<div class="table-responsive">
    <table class="table align-middle">
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Nombre</th>
                <th scope="col">Slug</th>
                <th scope="col">Categoría</th>
                <th scope="col">Precio</th>
                <th scope="col">Stock</th>
                <th scope="col">Descripción</th>
                <th scope="col">Acción</th>
            </tr>
        </thead>
        <tbody>
            @forelse($products as $product)
                <div wire:key="{{ $product->id }}">
                    <tr>
                        <th scope="row">
                            @if($product->item->image)
                                <div>
                                    <img src="{{ asset($this->verySmall('storage/items/', $product->item->image)) }}" loading="lazy">
                                </div>
                            @endif
                        </th>
                        <td>
                            {!! $product->item->status ? $product->item->name : '<del>' . $product->item->name . '</del>' !!}
                        </td>
                        <td><code>/{{ $product->item->slug }}</code></td>
                        <td>{{ $product->item->category->name }}</td>
                        <td>{{ $product->item->price }}</td>
                        <td>
                            <h5>
                                @switch($product->stock)
                                    @case(0)
                                        <span class="badge bg-danger">
                                            {{ $product->stock }}
                                        </span>
                                        @break

                                    @case($product->stock > 0 && $product->stock < 5)
                                        <span class="badge bg-warning">
                                            {{ $product->stock }}
                                        </span>
                                        @break

                                    @case($product->stock >= 5)
                                        <span class="badge bg-success">
                                            {{ $product->stock }}
                                        </span>
                                        @break

                                    @default

                                @endswitch
                            </h5>
                        </td>
                        <td>{{ $product->item->description }}</td>
                        <td>
                            <div class="btn-group" role="group" aria-label="Default button group">
                                <a href="{{ tenant_url('/dashboard/products/' . $product->id . '/edit') }}" class="btn btn-ghost-warning" type="button" title="Editar">
                                    <i class="cil-pencil"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                </div>
            @empty
                <tr>
                    <td colspan="8">
                        Sin resultados @if($this->search)para la buśqueda <strong>{{ $this->search }}</strong>@endif
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div>
        {{ $products->links() }}
    </div>

</div>
