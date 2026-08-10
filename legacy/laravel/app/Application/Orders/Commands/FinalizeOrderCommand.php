<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\FinalizeOrderData;
use App\Domain\Orders\Exceptions\InconsistentOrderPaymentsException;
use App\Domain\Orders\Exceptions\InsufficientStockException;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Domain\Orders\Exceptions\OrderHasNoItemsException;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class FinalizeOrderCommand
{
    public function __construct(
        private readonly RecalculateOrderTotalsCommand $recalculateOrderTotalsCommand,
    ) {}

    public function handle(FinalizeOrderData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        return DB::transaction(function () use ($data) {
            $order = Order::query()
                ->with(['items', 'payments'])
                ->lockForUpdate()
                ->findOrFail($data->orderId);

            if ($order->status !== 'draft') {
                throw InvalidOrderStateException::draftRequired((string) $order->status);
            }

            if ($order->items->isEmpty()) {
                throw OrderHasNoItemsException::forFinalize();
            }

            $order = $this->recalculateOrderTotalsCommand->handle((int) $order->id);
            $order->load(['items', 'payments']);

            $paymentsTotal = (float) $order->payments->sum('amount');
            if (round($paymentsTotal, 2) !== round((float) $order->total, 2)) {
                throw InconsistentOrderPaymentsException::forTotals($paymentsTotal, (float) $order->total);
            }

            foreach ($order->items as $itemOrder) {
                $product = Product::query()->lockForUpdate()->findOrFail((int) $itemOrder->product_id);
                if ($product->stock < $itemOrder->quantity) {
                    throw InsufficientStockException::forProduct(
                        (int) $product->id,
                        (int) $itemOrder->quantity,
                        (int) $product->stock
                    );
                }
            }

            foreach ($order->items as $itemOrder) {
                $product = Product::query()->lockForUpdate()->findOrFail((int) $itemOrder->product_id);
                $product->stock = (int) $product->stock - (int) $itemOrder->quantity;
                $product->save();
            }

            $order->update([
                'status' => 'finalized',
                'payment_status' => true,
                'finalized_at' => now(),
            ]);

            return $order->fresh(['items.product.item', 'payments', 'customer', 'employee']);
        });
    }
}

