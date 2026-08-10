<div class="card mb-4">

    <div class="card-header">
        <strong>Información del ticket</strong>
    </div>

    <div class="card-body">

        <div class="row mb-4">
            <h6 class="mb-3">
                Ticket <strong>#{{ $order->id }}</strong>

                <div class="float-end">
                    <a href="{{ tenant_url('/dashboard/orders/print/' . $order->id) }}" target="_blank" class="btn btn-info rounded-0 ms-auto me-1 d-print-none">
                        <svg class="icon">
                            <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-print') }}"></use>
                        </svg>
                        Imprimir
                    </a>
                </div>
            </h6>

            <div>
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-user') }}"></use>
                </svg>
                <strong>
                    @if ($order->customer_id == 1)
                        {{ $order->customer->user->name }}: {{ $order->name }}
                    @else
                        {{ $order->name }}
                    @endif
                </strong>
            </div>
            <div>
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-calendar') }}"></use>
                </svg>
                {{ $order->created_at->format('d-m-Y H:i') }}
            </div>
            <div>
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-credit-card') }}"></use>
                </svg>
                Pago: {{ $order->payment_status ? 'Realizado' : 'Pendiente' }}
            </div>

        </div><!-- /.row-->
        <div class="table-responsive-sm">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th class="center">#</th>
                        <th>Item</th>
                        <th class="right">Precio</th>
                        <th class="center">Cantidad</th>
                        <th class="right">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $key => $item)
                        <tr>
                            <td class="center">{{ ++$key }}</td>
                            <td class="left">{{ $item->item->name }}</td>
                            <td class="right">{{ $item->price }}</td>
                            <td class="center">x{{ $item->quantity }}</td>
                            <td class="right">{{ $item->price * $item->quantity }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="row">
            <div class="col-lg-4 col-sm-5 ms-auto">
                <table class="table table-clear">
                    <tbody>
                        <tr>
                            <td class="left">
                                <strong>Subtotal</strong>
                            </td>
                            <td class="right">{{ $order->subtotal }}</td>
                        </tr>
                        <tr>
                            <td class="left">
                                <strong>Descuento</strong>
                            </td>
                            <td class="right">{{ $order->discount }}</td>
                        </tr>
                        <tr>
                            <td class="left">
                                <strong>Total</strong>
                            </td>
                            <td class="right"><strong>{{ $order->total }}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
