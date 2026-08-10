<div>

    @section('nav-content')
        <li class="breadcrumb-item"><a href="{{ tenant_url('/dashboard/orders') }}">Tickets</a></li>
        <li class="breadcrumb-item active"><span>Ver</span></li>
    @endsection

    <livewire:dashboard.orders.show-order :order="$order" />

</div>
