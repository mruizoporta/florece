<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\UpdateOrderItemQuantityData;
use App\Domain\Orders\Exceptions\InvalidOrderQuantityException;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Models\ItemOrder;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class UpdateOrderItemQuantityCommand
{
    public function __construct(
        private readonly RecalculateOrderTotalsCommand $recalculateOrderTotalsCommand,
    ) {}

    public function handle(UpdateOrderItemQuantityData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if ($data->quantity <= 0) {
            throw InvalidOrderQuantityException::forQuantity($data->quantity);
        }

        return DB::transaction(function () use ($data) {
            $order = Order::query()->lockForUpdate()->findOrFail($data->orderId);
            if ($order->status !== 'draft') {
                throw InvalidOrderStateException::draftRequired((string) $order->status);
            }

            $item = ItemOrder::query()
                ->where('order_id', $order->id)
                ->findOrFail($data->itemOrderId);

            $item->quantity = $data->quantity;
            $item->line_total = round($item->quantity * (float) $item->unit_price_snapshot, 2);
            $item->price = $item->unit_price_snapshot;
            $item->save();

            return $this->recalculateOrderTotalsCommand->handle((int) $order->id);
        });
    }
}

