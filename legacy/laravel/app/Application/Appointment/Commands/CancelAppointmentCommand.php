<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\CancelAppointmentData;
use App\Models\Appointment;
use App\Models\Tenant;

class CancelAppointmentCommand
{
    public function handle(CancelAppointmentData $data): Appointment
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $appointment = Appointment::query()->findOrFail($data->appointmentId);
        $appointment->update(['status_id' => 1]);

        return $appointment->fresh();
    }
}
