<div class="table-responsive">
    <table class="table align-middle">
        <thead>
            <tr>
                <th scope="col">#</th>
                <th scope="col">Cliente</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Pago</th>
                <th scope="col">Acción</th>
            </tr>
        </thead>
        <tbody>
            @forelse($orders as $order)
                <div wire:key="{{ $order->id }}">
                    <tr>
                        <th scope="row">
                            <a href="{{ tenant_url('/dashboard/orders/' . $order->id) }}">
                                {{ $order->id }}
                            </a>
                        </th>
                        <td>
                            <a href="{{ tenant_url('/dashboard/orders/' . $order->id) }}">
                                {{ $order->name }}
                            </a>
                        </td>
                        <td>
                            @foreach ($order->items as $item)
                                <div class="avatar" title="{{ $item->item->name }}">
                                    <img class="avatar-img"
                                        src="{{ asset($this->verySmall('storage/items/', $item->item->image)) }}"
                                        alt="" loading="lazy">
                                </div>
                            @endforeach
                        </td>
                        <td>
                            {{ $order->total }}
                        </td>
                        <td>
                            @if ($order->payment_status)
                                <span class="badge text-bg-success">Realizado</span>
                            @else
                                <span class="badge text-bg-warning">Pendiente</span>
                            @endif
                        </td>

                        <td>

                            <div class="btn-group" role="group" aria-label="Default button group">
                                <a href="{{ tenant_url('/dashboard/orders/' . $order->id) }}" class="btn btn-ghost-info" type="button" title="Ver ticket">
                                    <svg class="icon">
                                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-search') }}"></use>
                                    </svg>
                                </a>
                                <a href="{{ tenant_url('/dashboard/orders/print/' . $order->id) }}" target="_blank" class="btn btn-ghost-dark" type="button" title="Imprimir">
                                    <svg class="icon">
                                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-print') }}"></use>
                                    </svg>
                                </a>
                                <a href="javascript:void(0)" @click="$dispatch('delete-order', { id: {{ $order->id }} })" class="btn btn-ghost-danger" type="button" title="Eliminar">
                                    <svg class="icon">
                                        <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-trash') }}"></use>
                                    </svg>
                                </a>
                            </div>
                        </td>
                    </tr>
                </div>
            @empty
                <tr>
                    <td colspan="7">
                        Sin resultados
                        @if($this->search)
                            para la buśqueda <strong>{{ $this->search }}</strong>
                        @endif
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div>
        {{ $orders->links() }}
    </div>

    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div id="liveToast2" class="toast" role="alert" aria-live="assertive" aria-atomic="true"
            data-coreui-autohide="false">
            <div class="toast-body">
                <span id="toastQuestion"></span>
                <div class="mt-2 pt-2 border-top">
                    <button type="button" wire:click="delete($event.target.getAttribute('data-order-id'))"
                        id="btn-delete-order" class="btn btn-danger btn-sm text-white">Eliminar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-coreui-dismiss="toast">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    @push('js')
        <script>
            window.addEventListener('delete-order', event => {
                var id = event.detail.id

                const toastLiveExample = document.getElementById('liveToast2')

                const deleteButton = toastLiveExample.querySelector('#btn-delete-order');
                deleteButton.setAttribute('data-order-id', id);

                toastQuestion.textContent = `¿Deseas eliminar el ticket #${id}?`

                const toast = new coreui.Toast(toastLiveExample)
                toast.show()
            });
        </script>
    @endpush

</div>
