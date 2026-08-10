<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\UpdateStockData;
use App\Domain\Catalog\Exceptions\InvalidProductStockException;
use App\Domain\Catalog\Product\Product as ProductEntity;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class UpdateStockCommand
{
    public function handle(UpdateStockData $data): Product
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $product = Product::query()->findOrFail($data->productId);

        // Validaciones de dominio (stock >= 0).
        new ProductEntity(stock: $data->stock);

        if ($data->stockAlert !== null && $data->stockAlert < 0) {
            throw new \InvalidArgumentException('El stock_alert no puede ser negativo.');
        }

        return DB::transaction(function () use ($product, $data) {
            $updates = [
                'stock' => $data->stock,
            ];

            if ($data->stockAlert !== null) {
                $updates['stock_alert'] = $data->stockAlert;
            }

            $product->update($updates);

            return $product->fresh()->load(['item.category', 'images']);
        });
    }
}

