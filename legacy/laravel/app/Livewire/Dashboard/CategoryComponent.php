<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class CategoryComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.category-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.categories')]);
    }
}
