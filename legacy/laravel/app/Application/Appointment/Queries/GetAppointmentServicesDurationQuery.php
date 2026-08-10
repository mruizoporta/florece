<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;

class GetAppointmentServicesDurationQuery
{
    public function execute(int $appointmentId): int
    {
        return (int) Appointment::query()
            ->withSum('services', 'duration_time')
            ->findOrFail($appointmentId)
            ->services_sum_duration_time;
    }
}
