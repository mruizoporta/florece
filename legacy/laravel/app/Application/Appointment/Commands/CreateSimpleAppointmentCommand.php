<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\CreateSimpleAppointmentData;
use App\Models\Appointment;
use App\Models\Tenant;
use Carbon\Carbon;

class CreateSimpleAppointmentCommand
{
    public function handle(CreateSimpleAppointmentData $data): Appointment
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        return Appointment::create([
            'customer_id' => $data->customerId,
            'status_id' => $data->statusId,
            'type_id' => $data->typeId,
            'name' => $data->name,
            'employee_id' => null,
            'phone' => null,
            'start_time' => Carbon::now(),
            'end_time' => null,
        ]);
    }
}
