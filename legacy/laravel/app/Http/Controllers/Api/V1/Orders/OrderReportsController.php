<?php

namespace App\Http\Controllers\Api\V1\Orders;

use App\Application\Orders\Queries\OrdersPaymentsReportQuery;
use App\Application\Orders\Queries\OrdersProductsReportQuery;
use App\Application\Orders\Queries\OrdersSummaryReportQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Orders\OrdersReportRequest;
use App\Models\Order;
use Illuminate\Http\JsonResponse;

class OrderReportsController extends Controller
{
    public function summary(OrdersReportRequest $request, OrdersSummaryReportQuery $query): JsonResponse
    {
        $this->authorize('viewReports', Order::class);
        $v = $request->validated();

        return response()->json($query->execute($v['from'] ?? null, $v['to'] ?? null));
    }

    public function payments(OrdersReportRequest $request, OrdersPaymentsReportQuery $query): JsonResponse
    {
        $this->authorize('viewReports', Order::class);
        $v = $request->validated();

        return response()->json([
            'items' => $query->execute($v['from'] ?? null, $v['to'] ?? null),
        ]);
    }

    public function products(OrdersReportRequest $request, OrdersProductsReportQuery $query): JsonResponse
    {
        $this->authorize('viewReports', Order::class);
        $v = $request->validated();

        return response()->json([
            'items' => $query->execute($v['from'] ?? null, $v['to'] ?? null, (int) ($v['limit'] ?? 20)),
        ]);
    }
}

