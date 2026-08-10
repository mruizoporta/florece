<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Order;
use App\Models\ItemOrder;

class OrderShowComponent extends Component
{
    public Order $order;

    public function render()
    {
        return view('livewire.dashboard.order-show-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.order_show')]);
    }
}
