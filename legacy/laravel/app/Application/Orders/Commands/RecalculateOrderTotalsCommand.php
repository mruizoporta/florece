<?php

namespace App\Application\Orders\Commands;

use App\Domain\Orders\OrderTotalsCalculator;
use App\Models\Order;
use App\Models\Tenant;

class RecalculateOrderTotalsCommand
{
    public function __construct(
        private readonly OrderTotalsCalculator $calculator,
    ) {}

    public function handle(int $orderId): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $order = Order::query()->with('items')->findOrFail($orderId);
        $totals = $this->calculator->calculate(
            $order->items->map(fn ($item) => [
                'quantity' => (int) $item->quantity,
                'unit_price' => (float) ($item->unit_price_snapshot ?: $item->price),
                'line_discount' => (float) $item->line_discount,
                'line_tax' => (float) $item->line_tax,
            ])->values()->all()
        );

        $order->update([
            'subtotal' => $totals['subtotal'],
            'discount_total' => $totals['discount_total'],
            'discount' => $totals['discount_total'],
            'tax_total' => $totals['tax_total'],
            'total' => $totals['total'],
        ]);

        return $order->fresh(['items', 'payments', 'customer', 'employee']);
    }
}

