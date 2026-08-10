<?php

namespace App\Application\Orders\Commands;

use App\Application\Orders\DTOs\SyncOrderPaymentsData;
use App\Domain\Orders\Exceptions\InvalidOrderStateException;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SyncOrderPaymentsCommand
{
    private const ALLOWED_METHODS = ['cash', 'card', 'transfer', 'other'];

    public function handle(SyncOrderPaymentsData $data): Order
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        return DB::transaction(function () use ($data) {
            $order = Order::query()->lockForUpdate()->findOrFail($data->orderId);
            if ($order->status !== 'draft') {
                throw InvalidOrderStateException::draftRequired((string) $order->status);
            }

            OrderPayment::query()->where('order_id', $order->id)->delete();

            foreach ($data->payments as $payment) {
                $method = (string) $payment['method'];
                $amount = (float) $payment['amount'];
                if (! in_array($method, self::ALLOWED_METHODS, true)) {
                    throw new \InvalidArgumentException("Método de pago inválido: {$method}");
                }
                if ($amount <= 0) {
                    throw new \InvalidArgumentException('El monto de pago debe ser mayor a cero.');
                }

                OrderPayment::query()->create([
                    'order_id' => $order->id,
                    'method' => $method,
                    'amount' => $amount,
                    'reference' => $payment['reference'] ?? null,
                    'paid_at' => isset($payment['paid_at']) && $payment['paid_at']
                        ? Carbon::parse((string) $payment['paid_at'])
                        : null,
                ]);
            }

            return $order->fresh(['items', 'payments', 'customer', 'employee']);
        });
    }
}

