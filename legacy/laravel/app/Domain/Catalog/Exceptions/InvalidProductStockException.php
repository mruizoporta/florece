<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class InvalidProductStockException extends DomainException
{
    public static function forNegativeStock(int $stock): self
    {
        return new self('El stock del producto no puede ser negativo.');
    }
}

