<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\ChangeAppointmentStatusData;
use App\Models\Appointment;
use App\Models\Tenant;
use Carbon\Carbon;

class ChangeAppointmentStatusCommand
{
    public function handle(ChangeAppointmentStatusData $data): Appointment
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if (! in_array($data->statusId, [3, 4, 5], true)) {
            throw new \InvalidArgumentException('Use cancel o creación para otros estados.');
        }

        $appointment = Appointment::query()->findOrFail($data->appointmentId);

        $updates = ['status_id' => $data->statusId];

        if ($data->statusId === 4) {
            if ($data->durationMinutes === null || $data->durationMinutes < 1) {
                throw new \InvalidArgumentException('Se requiere duration_minutes al pasar a en atención.');
            }
            $now = Carbon::now();
            $updates['start_time'] = $now;
            $updates['end_time'] = $now->copy()->addMinutes($data->durationMinutes);
        }

        $appointment->update($updates);

        return $appointment->fresh();
    }
}
