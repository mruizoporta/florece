<?php

namespace App\Domain\Orders\Exceptions;

class OrderHasNoItemsException extends \DomainException
{
    public static function forFinalize(): self
    {
        return new self('No se puede finalizar una orden sin líneas.');
    }
}

