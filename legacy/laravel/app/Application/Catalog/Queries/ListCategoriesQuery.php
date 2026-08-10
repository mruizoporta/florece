<?php

namespace App\Application\Catalog\Queries;

use App\Models\Category;
use Illuminate\Support\Collection;

class ListCategoriesQuery
{
    /**
     * @return Collection<int, \App\Models\Category>
     */
    public function execute(?string $search = null, int $limit = 100): Collection
    {
        $limit = max(1, $limit);

        $query = Category::query()
            ->orderBy('created_at', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        return $query->limit($limit)->get();
    }
}

