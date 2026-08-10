<?php

namespace App\Application\Catalog\DTOs;

final class UpdateStockData
{
    public function __construct(
        public readonly int $productId,
        public readonly int $stock,
        public readonly ?int $stockAlert = null,
    ) {}
}

