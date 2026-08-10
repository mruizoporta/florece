<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class InvalidServiceDurationException extends DomainException
{
    public static function forNonPositiveDuration(int $durationMinutes): self
    {
        return new self('La duración del servicio debe ser mayor a cero.');
    }
}

