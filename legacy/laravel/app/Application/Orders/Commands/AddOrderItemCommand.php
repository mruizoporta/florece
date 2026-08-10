<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\AddOrderItemData;
use App\Domain\Orders\Exceptions\InvalidOrderQuantityException;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Models\ItemOrder;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class AddOrderItemCommand
{
    public function __construct(
        private readonly RecalculateOrderTotalsCommand $recalculateOrderTotalsCommand,
    ) {}

    public function handle(AddOrderItemData $data): Order
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

            $product = Product::query()->with('item')->findOrFail($data->productId);
            if (! $product->item || ! (bool) $product->item->status) {
                throw new \InvalidArgumentException('El producto no está activo para venta.');
            }

            $existing = ItemOrder::query()
                ->where('order_id', $order->id)
                ->where('product_id', $product->id)
                ->first();

            if ($existing) {
                $existing->quantity += $data->quantity;
                $existing->line_total = round($existing->quantity * $existing->unit_price_snapshot, 2);
                $existing->price = $existing->unit_price_snapshot;
                $existing->save();
            } else {
                ItemOrder::query()->create([
                    'order_id' => $order->id,
                    'item_id' => (int) $product->item_id,
                    'product_id' => $product->id,
                    'price' => (float) $product->item->price,
                    'product_name_snapshot' => (string) $product->item->name,
                    'unit_price_snapshot' => (float) $product->item->price,
                    'quantity' => $data->quantity,
                    'line_discount' => 0,
                    'line_tax' => 0,
                    'line_total' => round($data->quantity * (float) $product->item->price, 2),
                ]);
            }

            return $this->recalculateOrderTotalsCommand->handle((int) $order->id);
        });
    }
}

