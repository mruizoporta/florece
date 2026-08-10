<?php

namespace App\Domain\Catalog\Exceptions;

use DomainException;

final class CategoryHasItemsException extends DomainException
{
    public static function forCategory(int $categoryId): self
    {
        return new self("No se puede archivar la categoría {$categoryId} porque tiene items asociados.");
    }
}

