<?php

namespace App\Http\Controllers\Api\V1\Orders;

use App\Application\Orders\Commands\AddOrderItemCommand;
use App\Application\Orders\Commands\RemoveOrderItemCommand;
use App\Application\Orders\Commands\UpdateOrderItemQuantityCommand;
use App\Application\Orders\DTOs\AddOrderItemData;
use App\Application\Orders\DTOs\RemoveOrderItemData;
use App\Application\Orders\DTOs\UpdateOrderItemQuantityData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\AddOrderItemRequest;
use App\Http\Requests\Api\V1\Orders\UpdateOrderItemRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Models\ItemOrder;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class OrderItemsController extends Controller
{
    public function store(
        AddOrderItemRequest $request,
        Order $order,
        AddOrderItemCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $order);
        $v = $request->validated();

        try {
            $updated = $command->handle(new AddOrderItemData(
                orderId: (int) $order->id,
                productId: (int) $v['product_id'],
                quantity: (int) $v['quantity'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }

    public function update(
        UpdateOrderItemRequest $request,
        Order $order,
        ItemOrder $item,
        UpdateOrderItemQuantityCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $order);
        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateOrderItemQuantityData(
                orderId: (int) $order->id,
                itemOrderId: (int) $item->id,
                quantity: (int) $v['quantity'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }

    public function destroy(
        Order $order,
        ItemOrder $item,
        RemoveOrderItemCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $order);

        try {
            $updated = $command->handle(new RemoveOrderItemData(
                orderId: (int) $order->id,
                itemOrderId: (int) $item->id,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }
}

