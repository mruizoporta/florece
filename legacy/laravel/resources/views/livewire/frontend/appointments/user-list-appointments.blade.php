<div class="table-responsive">
    <table class="table table-bordered table-striped">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Empleado</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th>Acción</th>
            </tr>
        </thead>
        <tbody>
            @foreach($appointments as $appointment)
                <tr class="text-nowrap">
                    <td>
                        <code>
                            {{ \Carbon\Carbon::parse($appointment->start_time)->format('d-m-Y H:i') }}
                        </code>
                    </td>
                    <td>
                        <img class="avatar-sm avatar-img img-circle" src="{{ asset($this->verySmall('storage/employees/', $appointment->employee->image)) }}" alt="{{ $appointment->employee->name }}" width="32px">
                        {{ $appointment->employee->name }}
                    </td>
                    <td>
                        @foreach($appointment->services as $service)
                            <img class="avatar-sm avatar-img img-circle" src="{{ asset($this->verySmall('storage/items/', $service->item->image)) }}" alt="{{ $service->item->name }}" width="32px" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="{{ $service->item->name }}">
                        @endforeach
                    </td>
                    <td>
                        <span class="badge text-bg-{{ $appointment->status->bg_color }}">
                            {{ $appointment->status->name }}
                        </span>
                    </td>
                    <td>
                        @if($appointment->status_id == 2)
                            <a wire:click="cancelAppointment({{ $appointment->id }})" wire:confirm="¿Deseas cancelar tu agenda con {{ $appointment->employee->name }}?" href="javascript:void(0)" class="button button-mini button-border button-rounded button-red">
                                <i class="icon-trash"></i> Cancelar
                            </a>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($appointments->isEmpty())
        <div class="alert alert-primary" role="alert">
            No se encontraron registros.
        </div>
    @endif

    {{ $appointments->links() }}

</div>
