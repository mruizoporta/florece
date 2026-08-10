<?php

namespace App\Application\Catalog\DTOs;

final class UpdateCategoryData
{
    public function __construct(
        public readonly int $categoryId,
        public readonly string $name,
        public readonly string $slug,
    ) {}
}

