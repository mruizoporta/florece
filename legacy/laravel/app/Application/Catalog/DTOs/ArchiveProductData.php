<?php

namespace App\Application\Catalog\DTOs;

final class ArchiveProductData
{
    public function __construct(
        public readonly int $productId,
        public readonly bool $active = false,
    ) {}
}

