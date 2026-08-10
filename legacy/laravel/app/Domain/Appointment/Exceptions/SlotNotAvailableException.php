<?php

namespace App\Domain\Appointment\Exceptions;

use DomainException;

class SlotNotAvailableException extends DomainException
{
    public static function forRequestedSlot(): self
    {
        return new self('El horario seleccionado no se encuentra disponible.');
    }
}
