<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\UpdateCategoryData;
use App\Domain\Catalog\Category\Category as CategoryEntity;
use App\Domain\Catalog\Exceptions\DuplicateCategoryNameException;
use App\Domain\Catalog\Exceptions\DuplicateCategorySlugException;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class UpdateCategoryCommand
{
    public function handle(UpdateCategoryData $data): Category
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $category = Category::query()->findOrFail($data->categoryId);

        new CategoryEntity(name: $data->name, slug: $data->slug);

        if (Category::query()->withTrashed()
            ->where('name', $data->name)
            ->where('id', '!=', $category->id)
            ->exists()
        ) {
            throw DuplicateCategoryNameException::forName($data->name);
        }

        if (Category::query()->withTrashed()
            ->where('slug', $data->slug)
            ->where('id', '!=', $category->id)
            ->exists()
        ) {
            throw DuplicateCategorySlugException::forSlug($data->slug);
        }

        return DB::transaction(function () use ($data, $category) {
            $category->update([
                'name' => $data->name,
                'slug' => $data->slug,
            ]);

            return $category->fresh();
        });
    }
}

