<?php

namespace App\Domain\Catalog\Category;

final class Category
{
    public function __construct(
        public readonly string $name,
        public readonly string $slug,
    ) {
        if (trim($this->name) === '') {
            throw new \InvalidArgumentException('El nombre de la categoría es requerido.');
        }

        if (trim($this->slug) === '') {
            throw new \InvalidArgumentException('El slug de la categoría es requerido.');
        }
    }
}

