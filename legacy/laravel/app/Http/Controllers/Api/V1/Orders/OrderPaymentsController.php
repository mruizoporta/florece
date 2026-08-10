<?php

namespace App\Http\Controllers\Api\V1\Orders;

use App\Application\Orders\Commands\SyncOrderPaymentsCommand;
use App\Application\Orders\DTOs\SyncOrderPaymentsData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\SyncOrderPaymentsRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class OrderPaymentsController extends Controller
{
    public function sync(
        SyncOrderPaymentsRequest $request,
        Order $order,
        SyncOrderPaymentsCommand $command,
    ): JsonResponse|Response {
        $this->authorize('managePayments', $order);
        $v = $request->validated();

        try {
            $updated = $command->handle(new SyncOrderPaymentsData(
                orderId: (int) $order->id,
                payments: array_map(fn (array $payment) => [
                    'method' => (string) $payment['method'],
                    'amount' => (float) $payment['amount'],
                    'reference' => $payment['reference'] ?? null,
                    'paid_at' => $payment['paid_at'] ?? null,
                ], $v['payments'] ?? []),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }
}

