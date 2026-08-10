<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Imprimir</title>
    <x-favicon-links />
    <link href="{{ asset('coreui/css/style.css') }}" rel="stylesheet">
</head>

<body onload="window.print()">
    <div>
        <div class="row mb-4">

            <div class="col-2">
                <div>
                    <img src="{{ asset($this->small('storage/logo/', $settings->logo)) }}" alt="" width="96px" loading="lazy">
                </div>
            </div>

            <div class="col-3">
                <div>
                    {{ $settings->company_name }}
                </div>
                <div>
                    {{ $settings->address }}, {{ $settings->location }}
                </div>
                <div>
                    {{ $settings->phone }}
                </div>

            </div>

            <div class="col-7 text-end">
                <div>
                    <strong>Ticket #{{ $order->id }}</strong>
                </div>
                <div>
                    {{ date('d-m-Y H:i') }}
                </div>
            </div>

        </div>

        <!-- /.row-->
        <div class="table-responsive-sm mt-3">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th class="center">#</th>
                        <th>Item</th>
                        <th class="center">Precio</th>
                        <th class="right">Cantidad</th>
                        <th class="right">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $key => $item)
                        <tr>
                            <td class="center">{{ ++$key }}</td>
                            <td class="left">{{ $item->item->name }}</td>
                            <td class="center">{{ $item->price }}</td>
                            <td class="right">x{{ $item->quantity }}</td>
                            <td class="right">{{ number_format($item->price * $item->quantity, 2) }}</td>
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
</body>
</html>
