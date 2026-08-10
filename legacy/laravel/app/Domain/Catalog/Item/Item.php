<?php

namespace App\Domain\Catalog\Item;

use App\Domain\Catalog\Exceptions\InvalidItemPriceException;

final class Item
{
    public function __construct(
        public readonly int $categoryId,
        public readonly string $name,
        public readonly string $slug,
        public readonly float $price,
        public readonly string $description,
        public readonly ?string $image,
        public readonly bool $status,
    ) {
        if (trim($this->name) === '') {
            throw new \InvalidArgumentException('El nombre del item es requerido.');
        }

        if (trim($this->slug) === '') {
            throw new \InvalidArgumentException('El slug del item es requerido.');
        }

        if ($this->price < 0) {
            throw InvalidItemPriceException::forNegativePrice($this->price);
        }
    }
}

