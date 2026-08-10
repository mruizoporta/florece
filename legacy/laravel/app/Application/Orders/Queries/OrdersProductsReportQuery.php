<?php

namespace App\Application\Orders\Queries;

use App\Models\ItemOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OrdersProductsReportQuery
{
    /**
     * @return array<int, array{product_id:int,name:string,quantity:int,total:float}>
     */
    public function execute(?string $from = null, ?string $to = null, int $limit = 20): array
    {
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfMonth();
        $toDate = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();
        $limit = max(1, $limit);

        return ItemOrder::query()
            ->join('orders', 'orders.id', '=', 'item_order.order_id')
            ->whereBetween('orders.created_at', [$fromDate, $toDate])
            ->where('orders.status', 'finalized')
            ->select(
                'item_order.product_id',
                'item_order.product_name_snapshot',
                DB::raw('SUM(item_order.quantity) as quantity'),
                DB::raw('SUM(item_order.line_total) as total')
            )
            ->groupBy('item_order.product_id', 'item_order.product_name_snapshot')
            ->orderByDesc('quantity')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'product_id' => (int) $row->product_id,
                'name' => (string) $row->product_name_snapshot,
                'quantity' => (int) $row->quantity,
                'total' => round((float) $row->total, 2),
            ])
            ->values()
            ->all();
    }
}

