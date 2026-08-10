<?php

namespace App\Livewire\Dashboard\Orders;

use Livewire\Component;

use App\Models\ItemOrder;

class ShowOrder extends Component
{
    public $order;

    public function render()
    {
        return view('livewire.dashboard.orders.show-order')->with([
            'items' => ItemOrder::with('item')->where('order_id', $this->order->id)->get()
        ]);
    }
}
