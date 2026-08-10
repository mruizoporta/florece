<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\CreateCategoryData;
use App\Domain\Catalog\Category\Category as CategoryEntity;
use App\Domain\Catalog\Exceptions\DuplicateCategoryNameException;
use App\Domain\Catalog\Exceptions\DuplicateCategorySlugException;
use App\Models\Category;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CreateCategoryCommand
{
    public function handle(CreateCategoryData $data): Category
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        new CategoryEntity(name: $data->name, slug: $data->slug);

        if (Category::query()->withTrashed()->where('name', $data->name)->exists()) {
            throw DuplicateCategoryNameException::forName($data->name);
        }

        if (Category::query()->withTrashed()->where('slug', $data->slug)->exists()) {
            throw DuplicateCategorySlugException::forSlug($data->slug);
        }

        return DB::transaction(function () use ($data) {
            $category = Category::query()->create([
                'name' => $data->name,
                'slug' => $data->slug,
            ]);

            return $category->fresh();
        });
    }
}

