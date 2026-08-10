<?php

namespace App\Http\Controllers\Api\V1\Orders;

use App\Application\Orders\Commands\CancelOrderCommand;
use App\Application\Orders\Commands\CreateOrderCommand;
use App\Application\Orders\Commands\FinalizeOrderCommand;
use App\Application\Orders\DTOs\CancelOrderData;
use App\Application\Orders\DTOs\CreateOrderData;
use App\Application\Orders\DTOs\FinalizeOrderData;
use App\Application\Orders\Queries\GetOrderDetailQuery;
use App\Application\Orders\Queries\ListOrdersQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\CancelOrderRequest;
use App\Http\Requests\Api\V1\Orders\IndexOrdersRequest;
use App\Http\Requests\Api\V1\Orders\StoreOrderRequest;
use App\Http\Resources\Orders\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class OrdersController extends Controller
{
    public function index(IndexOrdersRequest $request, ListOrdersQuery $query): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Order::class);
        $v = $request->validated();

        $orders = $query->execute(
            search: $v['search'] ?? null,
            status: $v['status'] ?? null,
            limit: (int) ($v['limit'] ?? 50),
        );

        return OrderResource::collection($orders);
    }

    public function show(Order $order, GetOrderDetailQuery $query): OrderResource
    {
        $this->authorize('view', $order);

        return new OrderResource($query->execute((int) $order->id));
    }

    public function store(StoreOrderRequest $request, CreateOrderCommand $command): JsonResponse|Response
    {
        $this->authorize('create', Order::class);
        $v = $request->validated();

        try {
            $order = $command->handle(new CreateOrderData(
                customerId: isset($v['customer_id']) ? (int) $v['customer_id'] : null,
                employeeId: isset($v['employee_id']) ? (int) $v['employee_id'] : null,
                name: (string) $v['name'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function finalize(Order $order, FinalizeOrderCommand $command): JsonResponse|Response
    {
        $this->authorize('finalize', $order);

        try {
            $updated = $command->handle(new FinalizeOrderData((int) $order->id));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }

    public function cancel(
        CancelOrderRequest $request,
        Order $order,
        CancelOrderCommand $command,
    ): JsonResponse|Response {
        $this->authorize('cancel', $order);
        $v = $request->validated();

        try {
            $updated = $command->handle(new CancelOrderData(
                orderId: (int) $order->id,
                reason: $v['reason'] ?? null,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new OrderResource($updated))->response();
    }
}

