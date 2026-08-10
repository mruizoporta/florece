<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\CreateServiceData;
use App\Domain\Catalog\Exceptions\DuplicateItemNameException;
use App\Domain\Catalog\Exceptions\DuplicateItemSlugException;
use App\Domain\Catalog\Item\Item as ItemEntity;
use App\Domain\Catalog\Service\Service as ServiceEntity;
use App\Models\Category;
use App\Models\Item;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CreateServiceCommand
{
    public function handle(CreateServiceData $data): Service
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if (! Category::query()->where('id', $data->categoryId)->exists()) {
            throw new \InvalidArgumentException('La categoría seleccionada es inválida.');
        }

        if (Item::query()->where('slug', $data->slug)->exists()) {
            throw DuplicateItemSlugException::forSlug($data->slug);
        }

        if (Item::query()->where('name', $data->name)->exists()) {
            throw DuplicateItemNameException::forName($data->name);
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

        new ServiceEntity(durationTime: $data->durationTime);

        return DB::transaction(function () use ($data) {
            $item = Item::query()->create([
                'category_id' => $data->categoryId,
                'name' => $data->name,
                'slug' => $data->slug,
                'price' => $data->price,
                'description' => $data->description,
                'image' => $data->image,
                'status' => $data->status,
            ]);

            $service = Service::query()->create([
                'item_id' => $item->id,
                'duration_time' => $data->durationTime,
            ]);

            return $service->load(['item.category']);
        });
    }
}

