<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class OrderComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.order-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.orders')]);
    }
}
