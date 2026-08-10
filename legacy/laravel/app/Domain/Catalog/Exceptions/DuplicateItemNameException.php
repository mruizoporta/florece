<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class DuplicateItemNameException extends DomainException
{
    public static function forName(string $name): self
    {
        return new self("El nombre del item '{$name}' ya existe para este salón.");
    }
}

