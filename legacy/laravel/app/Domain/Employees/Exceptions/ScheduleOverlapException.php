<?php

namespace App\Domain\Employees\Exceptions;

class ScheduleOverlapException extends \DomainException
{
    public static function forWeekday(int $weekday): self
    {
        return new self("Hay solapes en el horario del día {$weekday}.");
    }
}

