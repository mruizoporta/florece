<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\UpdateProductData;
use App\Domain\Catalog\Exceptions\DuplicateItemNameException;
use App\Domain\Catalog\Exceptions\DuplicateItemSlugException;
use App\Domain\Catalog\Item\Item as ItemEntity;
use App\Domain\Catalog\Product\Product as ProductEntity;
use App\Models\Category;
use App\Models\Item;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class UpdateProductCommand
{
    public function handle(UpdateProductData $data): Product
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $product = Product::query()->with('item')->findOrFail($data->productId);
        $item = $product->item;

        if (! Category::query()->where('id', $data->categoryId)->exists()) {
            throw new \InvalidArgumentException('La categoría seleccionada es inválida.');
        }

        new ItemEntity(
            categoryId: $data->categoryId,
            name: $data->name,
            slug: $data->slug,
            price: $data->price,
            description: $data->description,
            image: $data->image,
            status: $data->status,
        );

        new ProductEntity(stock: $data->stock);

        $slugExists = Item::query()
            ->where('slug', $data->slug)
            ->where('id', '!=', $item->id)
            ->exists();

        if ($slugExists) {
            throw DuplicateItemSlugException::forSlug($data->slug);
        }

        $nameExists = Item::query()
            ->where('name', $data->name)
            ->where('id', '!=', $item->id)
            ->exists();

        if ($nameExists) {
            throw DuplicateItemNameException::forName($data->name);
        }

        if ($data->stockAlert < 0) {
            throw new \InvalidArgumentException('El stock_alert no puede ser negativo.');
        }

        return DB::transaction(function () use ($data, $product, $item) {
            $item->update([
                'category_id' => $data->categoryId,
                'name' => $data->name,
                'slug' => $data->slug,
                'price' => $data->price,
                'description' => $data->description,
                'image' => $data->image,
                'status' => $data->status,
            ]);

            $product->update([
                'stock' => $data->stock,
                'stock_alert' => $data->stockAlert,
                'long_description' => $data->longDescription,
            ]);

            return $product->fresh()->load(['item.category', 'images']);
        });
    }
}

