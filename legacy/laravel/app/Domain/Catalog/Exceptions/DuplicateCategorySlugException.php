<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class DuplicateCategorySlugException extends DomainException
{
    public static function forSlug(string $slug): self
    {
        return new self("El slug '{$slug}' de la categoría ya existe para este salón.");
    }
}

