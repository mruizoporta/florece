<?php

namespace App\Application\Appointment\DTOs;

final class RemoveServiceFromAppointmentData
{
    public function __construct(
        public readonly int $appointmentId,
        public readonly int $serviceId,
    ) {}
}
