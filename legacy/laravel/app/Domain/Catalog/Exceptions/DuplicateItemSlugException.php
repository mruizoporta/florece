<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class DuplicateItemSlugException extends DomainException
{
    public static function forSlug(string $slug): self
    {
        return new self("El slug '{$slug}' ya existe para este salón.");
    }
}

