<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\RemoveServiceFromAppointmentData;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Tenant;

class RemoveServiceFromAppointmentCommand
{
    public function handle(RemoveServiceFromAppointmentData $data): void
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        Appointment::query()->findOrFail($data->appointmentId);

        AppointmentService::query()
            ->where('appointment_id', $data->appointmentId)
            ->where('service_id', $data->serviceId)
            ->firstOrFail()
            ->delete();
    }
}
