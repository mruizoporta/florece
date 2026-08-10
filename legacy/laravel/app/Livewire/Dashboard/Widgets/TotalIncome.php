<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Support\Facades\Cache;
use Livewire\Component;

class TotalIncome extends Component
{
    public function render()
    {
        $tenantId = Tenant::current()?->id ?? 0;

        return view('livewire.dashboard.widgets.total-income')->with([
            'totalIncome' => Cache::remember(
                "total-income-tenant-{$tenantId}",
                300,
                fn () => Order::where('payment_status', true)->sum('total')
            ),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.kpi-metric', [
            'variant' => 'currency',
        ]);
    }
}
