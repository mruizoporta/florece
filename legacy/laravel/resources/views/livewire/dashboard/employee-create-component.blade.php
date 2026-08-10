<div>

    @section('nav-content')
    <li class="breadcrumb-item"><a href="{{ tenant_url('/dashboard/employees') }}">Empleados</a></li>
        <li class="breadcrumb-item active"><span>Nuevo</span></li>
    @endsection

    <div class="card mb-4">
        <div class="card-header">
            <strong>Nuevo empleado</strong>
        </div>

        <div class="card-body">

            <div class="my-3">
                <livewire:dashboard.employees.create-employee lazy />
            </div>

        </div>
    </div>

</div>
