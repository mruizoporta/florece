<?php

namespace App\Application\Orders\Queries;

use App\Models\Order;

class GetOrderDetailQuery
{
    public function execute(int $orderId): Order
    {
        return Order::query()
            ->with(['items.product.item', 'payments', 'customer.user', 'employee'])
            ->findOrFail($orderId);
    }
}

