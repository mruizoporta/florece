<?php

namespace App\Domain\Catalog\Product;

use App\Domain\Catalog\Exceptions\InvalidProductStockException;

final class Product
{
    public function __construct(
        public readonly int $stock,
    ) {
        if ($this->stock < 0) {
            throw InvalidProductStockException::forNegativeStock($this->stock);
        }
    }
}

