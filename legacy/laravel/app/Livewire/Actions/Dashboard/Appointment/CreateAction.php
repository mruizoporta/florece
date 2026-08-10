<?php

namespace App\Livewire\Actions\Dashboard\Appointment;

use App\Application\Appointment\Commands\CreateSimpleAppointmentCommand;
use App\Application\Appointment\DTOs\CreateSimpleAppointmentData;

/**
 * @deprecated Preferir CreateSimpleAppointmentCommand / CreateAppointmentCommand desde aplicación.
 */
class CreateAction
{
    public function handle($name, $type_id, $employee_id = null, $phone = null, $start_time = false, $end_time = null, $status_id = 3)
    {
        return app(CreateSimpleAppointmentCommand::class)->handle(
            new CreateSimpleAppointmentData(name: $name, typeId: (int) $type_id, statusId: (int) $status_id)
        );
    }
}
