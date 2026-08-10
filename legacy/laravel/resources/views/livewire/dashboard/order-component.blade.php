<div>

    @section('nav-content')
        <li class="breadcrumb-item active"><span>Tickets</span></li>
    @endsection

    <div class="card mb-4">
        <div class="card-header">
            <strong>Listado de tickets</strong>
        </div>

        <div class="card-body">

            <livewire:dashboard.search-component />

            <livewire:dashboard.orders.list-orders />

        </div>
    </div>

</div>
