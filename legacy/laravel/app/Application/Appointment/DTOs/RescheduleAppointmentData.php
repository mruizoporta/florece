<?php

namespace App\Application\Appointment\DTOs;

use Carbon\Carbon;

final class RescheduleAppointmentData
{
    public function __construct(
        public readonly int $appointmentId,
        public readonly int $employeeId,
        public readonly Carbon $startTime,
        public readonly Carbon $endTime,
    ) {}
}
