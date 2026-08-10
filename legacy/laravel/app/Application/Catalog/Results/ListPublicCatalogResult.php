<?php

namespace App\Application\Catalog\Results;

use Illuminate\Support\Collection;

final class ListPublicCatalogResult
{
    /**
     * @param  Collection<int, \App\Models\Service>  $services
     * @param  Collection<int, \App\Models\Product>  $products
     * @param  Collection<int, \App\Models\Category>  $categories
     */
    public function __construct(
        public readonly Collection $services,
        public readonly Collection $products,
        public readonly Collection $categories,
    ) {}
}

