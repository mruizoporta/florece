<?php

namespace App\Application\Catalog\DTOs;

final class UpdateProductData
{
    public function __construct(
        public readonly int $productId,
        public readonly int $categoryId,
        public readonly string $name,
        public readonly string $slug,
        public readonly float $price,
        public readonly string $description,
        public readonly ?string $image,
        public readonly bool $status,
        public readonly int $stock,
        public readonly int $stockAlert,
        public readonly ?string $longDescription,
    ) {}
}

