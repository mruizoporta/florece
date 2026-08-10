<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Livewire\Traits\ImageTrait;

use App\Models\Order;
use App\Models\ItemOrder;

use App\Models\Setting;

class OrderPrintComponent extends Component
{
    use Imagetrait;

    public Order $order;

    public function render()
    {
        return view('livewire.dashboard.order-print-component')->with([
            'items' => ItemOrder::with('item')->where('order_id', $this->order->id)->get(),
            'settings' => Setting::first()
        ]);
    }
}
