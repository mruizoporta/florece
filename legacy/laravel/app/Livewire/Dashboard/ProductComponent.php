<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class ProductComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.product-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.products')]);
    }
}
