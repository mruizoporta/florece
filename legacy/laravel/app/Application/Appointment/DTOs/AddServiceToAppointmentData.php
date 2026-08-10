<?php

namespace App\Application\Appointment\DTOs;

final class AddServiceToAppointmentData
{
    public function __construct(
        public readonly int $appointmentId,
        public readonly int $serviceId,
    ) {}
}
