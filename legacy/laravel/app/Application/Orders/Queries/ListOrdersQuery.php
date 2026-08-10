<?php

namespace App\Application\Orders\Queries;

use App\Models\Order;
use Illuminate\Support\Collection;

class ListOrdersQuery
{
    /**
     * @return Collection<int, \App\Models\Order>
     */
    public function execute(?string $search = null, ?string $status = null, int $limit = 50): Collection
    {
        $limit = max(1, $limit);
        $query = Order::query()->with(['customer.user', 'employee']);

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }
        if ($status) {
            $query->where('status', $status);
        }

        return $query->orderByDesc('created_at')->limit($limit)->get();
    }
}

