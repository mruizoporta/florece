<?php

namespace App\Application\Appointment\DTOs;

/**
 * Cita rápida sin empleado, hora fin ni servicios (walk-in / placeholder).
 * No reutiliza CreateAppointmentData: reglas de negocio distintas.
 */
final class CreateSimpleAppointmentData
{
    public function __construct(
        public readonly string $name,
        public readonly int $typeId,
        public readonly int $statusId = 3,
        public readonly int $customerId = 1,
    ) {}
}
