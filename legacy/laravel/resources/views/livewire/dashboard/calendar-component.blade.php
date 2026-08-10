<div>

    @section('nav-content')
        <li class="breadcrumb-item active"><span>Calendario</span></li>
    @endsection

    <div class="card mb-4">
        <div class="card-header">
            <strong>Calendario de agendas</strong>
            <a href="{{ tenant_url('/dashboard/board') }}" class="btn btn-primary position-relative rounded-0 float-end" type="button">
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-speedometer') }}"></use>
                </svg>
                Tablero
            </a>
        </div>

        <div class="card-body">

            <livewire:dashboard.calendar.show-calendar />

        </div>
    </div>

    @push('css')
        <link href="{{ asset('libraries/fullcalendar/styles.css') }}" rel="stylesheet">
    @endpush

    @push('js')
        <script src="{{ asset('libraries/fullcalendar/global.js') }}"></script>
        <script src="{{ asset('libraries/fullcalendar/popper.min.js') }}"></script>
        <script src="{{ asset('libraries/fullcalendar/tooltip.min.js') }}"></script>
    @endpush

</div>
