<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\DeleteOrArchiveCategoryData;
use App\Domain\Catalog\Exceptions\CategoryHasItemsException;
use App\Models\Category;
use App\Models\Item;
use App\Models\Tenant;

class DeleteOrArchiveCategoryCommand
{
    public function handle(DeleteOrArchiveCategoryData $data): Category
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $category = Category::query()->findOrFail($data->categoryId);

        if (Item::query()->where('category_id', $category->id)->exists()) {
            throw CategoryHasItemsException::forCategory((int) $category->id);
        }

        $category->delete();

        return $category;
    }
}

