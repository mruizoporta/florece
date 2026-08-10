<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Models\Order;
use Livewire\Component;

class TicketsPendingCounter extends Component
{
    public function render()
    {
        return view('livewire.dashboard.widgets.tickets-pending-counter')->with([
            'ticketsPendingCounter' => Order::where('payment_status', false)->count(),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.kpi-metric');
    }
}
