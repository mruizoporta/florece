<?php

namespace App\Application\Appointment\DTOs;

final class ChangeAppointmentStatusData
{
    public function __construct(
        public readonly int $appointmentId,
        public readonly int $statusId,
        /** Duración en minutos al pasar a "en atención" (status 4). */
        public readonly ?int $durationMinutes = null,
    ) {}
}
