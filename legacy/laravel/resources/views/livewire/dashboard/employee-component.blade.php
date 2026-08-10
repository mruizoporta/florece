<div>

    @section('nav-content')
        <li class="breadcrumb-item active"><span>Empleados</span></li>
    @endsection

    <div class="card mb-4">
        <div class="card-header">
            <strong>Listado de empleados</strong>
            <a href="{{ tenant_url('/dashboard/employees/create') }}" class="btn btn-sm btn-primary float-end" type="button">
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-plus') }}"></use>
                </svg>
                Nuevo
            </a>
        </div>

        <div class="card-body">

            <livewire:dashboard.search-component lazy />

            <livewire:dashboard.employees.list-employees lazy />

        </div>
    </div>

</div>
