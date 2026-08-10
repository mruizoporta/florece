<?php

namespace App\Domain\Employees\Exceptions;

class InactiveEmployeeForAppointmentException extends \DomainException
{
    public static function forEmployee(int $employeeId): self
    {
        return new self("El empleado #{$employeeId} está archivado/inactivo y no puede recibir nuevas reservas.");
    }
}

