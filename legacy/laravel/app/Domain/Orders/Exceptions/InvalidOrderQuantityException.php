<?php

namespace App\Domain\Orders\Exceptions;

class InvalidOrderQuantityException extends \DomainException
{
    public static function forQuantity(int $quantity): self
    {
        return new self("La cantidad {$quantity} es inválida. Debe ser mayor a cero.");
    }
}

