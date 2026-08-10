<?php

namespace App\Application\Catalog\DTOs;

final class CreateCategoryData
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
    ) {}
}

