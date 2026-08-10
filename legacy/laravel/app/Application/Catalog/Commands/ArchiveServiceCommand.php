<?php

namespace App\Application\Catalog\Commands;

use App\Application\Catalog\DTOs\ArchiveServiceData;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class ArchiveServiceCommand
{
    public function handle(ArchiveServiceData $data): Service
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $service = Service::query()->with('item')->findOrFail($data->serviceId);
        $item = $service->item;

        return DB::transaction(function () use ($service, $item, $data) {
            $item->update(['status' => $data->active]);

            return $service->fresh()->load(['item.category']);
        });
    }
}

