<?php

namespace App\Application\Appointment\DTOs;

use Carbon\Carbon;

/**
 * Entrada del caso de uso CreateAppointment (dashboard / futura API).
 */
final class CreateAppointmentData
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $phone,
        public readonly int $typeId,
        public readonly int $employeeId,
        public readonly Carbon $startTime,
        public readonly Carbon $endTime,
        public readonly int $statusId,
        /** @var int[] */
        public readonly array $serviceIds,
        public readonly int $customerId = 1,
    ) {}
}
