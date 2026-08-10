<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\UpdateServiceData;
use App\Domain\Catalog\Exceptions\DuplicateItemNameException;
use App\Domain\Catalog\Exceptions\DuplicateItemSlugException;
use App\Domain\Catalog\Item\Item as ItemEntity;
use App\Domain\Catalog\Service\Service as ServiceEntity;
use App\Models\Category;
use App\Models\Item;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class UpdateServiceCommand
{
    public function handle(UpdateServiceData $data): Service
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $service = Service::query()->with('item')->findOrFail($data->serviceId);
        $item = $service->item;

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

        new ServiceEntity(durationTime: $data->durationTime);

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

        return DB::transaction(function () use ($data, $service, $item) {
            $item->update([
                'category_id' => $data->categoryId,
                'name' => $data->name,
                'slug' => $data->slug,
                'price' => $data->price,
                'description' => $data->description,
                'image' => $data->image,
                'status' => $data->status,
            ]);

            $service->update([
                'duration_time' => $data->durationTime,
            ]);

            return $service->fresh()->load(['item.category']);
        });
    }
}

