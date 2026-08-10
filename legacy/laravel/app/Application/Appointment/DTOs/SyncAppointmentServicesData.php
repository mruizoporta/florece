<?php

namespace App\Application\Appointment\DTOs;

final class SyncAppointmentServicesData
{
    /**
     * @param  int[]  $serviceIds
     */
    public function __construct(
        public readonly int $appointmentId,
        public readonly array $serviceIds,
    ) {}
}
