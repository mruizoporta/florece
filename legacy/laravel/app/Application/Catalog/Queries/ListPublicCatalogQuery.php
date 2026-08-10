<?php

namespace App\Application\Catalog\Queries;

use App\Application\Catalog\Results\ListPublicCatalogResult;
use App\Models\Category;
use App\Models\Item;
use App\Models\Product;
use App\Models\Service;

class ListPublicCatalogQuery
{
    public function execute(): ListPublicCatalogResult
    {
        // Público: solo lo activo (Item.status=true) y categorías no archivadas.
        $services = Service::query()
            ->with(['item.category'])
            ->whereHas('item', fn ($q) => $q
                ->where('status', true)
                ->whereHas('category'))
            ->orderBy('created_at', 'desc')
            ->get();

        $products = Product::query()
            ->with(['item.category', 'images'])
            ->whereHas('item', fn ($q) => $q
                ->where('status', true)
                ->whereHas('category'))
            ->orderBy('created_at', 'desc')
            ->get();

        $categoryIds = Item::query()
            ->where('status', true)
            ->whereHas('category')
            ->pluck('category_id')
            ->unique()
            ->values();

        $categories = $categoryIds->isEmpty()
            ? collect()
            : Category::query()
                ->whereIn('id', $categoryIds)
                ->orderBy('created_at', 'desc')
                ->get();

        return new ListPublicCatalogResult($services, $products, $categories);
    }
}

