<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\CancelOrderData;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CancelOrderCommand
{
    public function handle(CancelOrderData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        return DB::transaction(function () use ($data) {
            $order = Order::query()->with('items')->lockForUpdate()->findOrFail($data->orderId);

            if ($order->status === 'cancelled') {
                throw InvalidOrderStateException::cannotCancel((string) $order->status);
            }

            if ($order->status === 'finalized') {
                foreach ($order->items as $itemOrder) {
                    $product = Product::query()->lockForUpdate()->findOrFail((int) $itemOrder->product_id);
                    $product->stock = (int) $product->stock + (int) $itemOrder->quantity;
                    $product->save();
                }
            }

            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'cancelled_reason' => $data->reason,
            ]);

            return $order->fresh(['items.product.item', 'payments', 'customer', 'employee']);
        });
    }
}

