<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Category;

class ItemCreateComponent extends Component
{
    public $categories = [];

    public function mount()
    {
        $this->categories = Category::all();
    }

    public function render()
    {
        return view('livewire.dashboard.item-create-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.item_new')]);
    }
}
