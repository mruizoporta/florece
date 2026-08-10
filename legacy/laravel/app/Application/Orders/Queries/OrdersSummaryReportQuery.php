<?php

namespace App\Application\Orders\Queries;

use App\Models\Order;
use Carbon\Carbon;

class OrdersSummaryReportQuery
{
    /**
     * @return array<string, mixed>
     */
    public function execute(?string $from = null, ?string $to = null): array
    {
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfMonth();
        $toDate = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();

        $orders = Order::query()
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->where('status', 'finalized')
            ->get(['id', 'total']);

        $count = $orders->count();
        $totalSales = (float) $orders->sum('total');
        $averageTicket = $count > 0 ? $totalSales / $count : 0.0;

        return [
            'from' => $fromDate->toDateString(),
            'to' => $toDate->toDateString(),
            'orders_count' => $count,
            'total_sales' => round($totalSales, 2),
            'average_ticket' => round($averageTicket, 2),
        ];
    }
}

