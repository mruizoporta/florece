<?php

namespace App\Application\Appointment\DTOs;

final class CancelAppointmentData
{
    public function __construct(
        public readonly int $appointmentId,
    ) {}
}
