<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class DuplicateCategoryNameException extends DomainException
{
    public static function forName(string $name): self
    {
        return new self("El nombre de la categoría '{$name}' ya existe para este salón.");
    }
}

