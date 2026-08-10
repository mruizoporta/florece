<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class InvalidItemPriceException extends DomainException
{
    public static function forNegativePrice(float|int $price): self
    {
        return new self('El precio del item no puede ser negativo.');
    }
}

