<?php

namespace App\Application\Appointment\DTOs;

final class ChangeAppointmentEmployeeData
{
    public function __construct(
        public readonly int $appointmentId,
        public readonly int $employeeId,
    ) {}
}
