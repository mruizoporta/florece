<?php

namespace App\Application\Catalog\DTOs;

final class DeleteOrArchiveCategoryData
{
    public function __construct(
        public readonly int $categoryId,
    ) {}
}

