<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\RemoveOrderItemData;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Models\ItemOrder;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class RemoveOrderItemCommand
{
    public function __construct(
        private readonly RecalculateOrderTotalsCommand $recalculateOrderTotalsCommand,
    ) {}

    public function handle(RemoveOrderItemData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        return DB::transaction(function () use ($data) {
            $order = Order::query()->lockForUpdate()->findOrFail($data->orderId);
            if ($order->status !== 'draft') {
                throw InvalidOrderStateException::draftRequired((string) $order->status);
            }

            ItemOrder::query()
                ->where('order_id', $order->id)
                ->findOrFail($data->itemOrderId)
                ->delete();

            return $this->recalculateOrderTotalsCommand->handle((int) $order->id);
        });
    }
}

