<?php

namespace App\Livewire\Dashboard\Orders;

use Livewire\Component;
use Livewire\Attributes\On;

use App\Models\Order;

class NotifyIcon extends Component
{
    #[On('refresh-tickets')]
    public function render()
    {
        return view('livewire.dashboard.orders.notify-icon')->with([
            'quantity' => Order::where('payment_status', 0)->count()
        ]);
    }
}
