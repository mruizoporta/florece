<?php

namespace App\Application\Catalog\Queries;

use App\Models\Service;
use Illuminate\Support\Collection;

class ListServicesQuery
{
    /**
     * @return Collection<int, \App\Models\Service>
     */
    public function execute(?string $search = null, int $limit = 50): Collection
    {
        $limit = max(1, $limit);

        $query = Service::query()
            ->with(['item.category']);

        $query->whereHas('item', function ($q) {
            $q->where('status', true);
        });

        if ($search) {
            $query->whereHas('item', function ($q) use ($search) {
                $q->where('status', true)
                    ->where('name', 'like', '%' . $search . '%');
            });
        }

        return $query
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}

