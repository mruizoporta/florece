<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Livewire\Traits\ImageTrait;
use DB;
use Livewire\Component;

class TopProductsSoldTable extends Component
{
    use ImageTrait;

    public function render()
    {
        return view('livewire.dashboard.widgets.top-products-sold-table')->with([
            'topProductsSold' => DB::table('item_order')
                ->join('items', 'item_order.item_id', '=', 'items.id')
                ->join('products', 'item_order.item_id', '=', 'products.item_id')
                ->join('orders', 'item_order.order_id', '=', 'orders.id')
                ->whereNull('orders.deleted_at') // Filtrar por deleted_at null en la tabla orders
                ->where('orders.payment_status', true)
                ->select('items.id', 'items.name', 'items.image', DB::raw('SUM(item_order.quantity) as total_sold'), DB::raw('SUM(item_order.quantity * items.price) as total_amount'))
                ->groupBy('items.id', 'items.name', 'items.image')
                ->orderByDesc('total_sold')
                ->take(5)
                ->get(),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.top-sold-items-table', [
            'nameHeaderKey' => 'app.dashboard.table_product',
        ]);
    }
}
