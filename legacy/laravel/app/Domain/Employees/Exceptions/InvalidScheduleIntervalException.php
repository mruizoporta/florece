<?php

namespace App\Domain\Employees\Exceptions;

class InvalidScheduleIntervalException extends \DomainException
{
    public static function forRange(string $start, string $end): self
    {
        return new self("La franja horaria [$start - $end] es inválida: start debe ser menor que end.");
    }
}

