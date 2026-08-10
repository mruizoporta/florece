<div>

    @section('nav-content')
        <li class="breadcrumb-item active"><span>Productos</span></li>
    @endsection

    <div class="card mb-4">
        <div class="card-header">
            <strong>Listado de productos</strong>
            <a href="{{ tenant_url('/dashboard/items/create') }}" class="btn btn-sm btn-primary float-end">
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-plus') }}"></use>
                </svg>
                Nuevo
            </a>
        </div>

        <div class="card-body">
            <livewire:dashboard.search-component lazy />

            <livewire:dashboard.products.list-products lazy />
        </div>
    </div>

</div>
