<?php

namespace App\Application\Orders\Queries;

use App\Models\OrderPayment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OrdersPaymentsReportQuery
{
    /**
     * @return array<int, array{method:string,total:float}>
     */
    public function execute(?string $from = null, ?string $to = null): array
    {
        $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::now()->startOfMonth();
        $toDate = $to ? Carbon::parse($to)->endOfDay() : Carbon::now()->endOfDay();

        return OrderPayment::query()
            ->whereBetween('created_at', [$fromDate, $toDate])
            ->select('method', DB::raw('SUM(amount) as total'))
            ->groupBy('method')
            ->orderBy('method')
            ->get()
            ->map(fn ($row) => [
                'method' => (string) $row->method,
                'total' => round((float) $row->total, 2),
            ])
            ->values()
            ->all();
    }
}

