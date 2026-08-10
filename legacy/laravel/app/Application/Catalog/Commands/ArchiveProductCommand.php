<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\ArchiveProductData;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class ArchiveProductCommand
{
    public function handle(ArchiveProductData $data): Product
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $product = Product::query()->with('item')->findOrFail($data->productId);
        $item = $product->item;

        return DB::transaction(function () use ($product, $item, $data) {
            $item->update(['status' => $data->active]);

            return $product->fresh()->load(['item.category', 'images']);
        });
    }
}

