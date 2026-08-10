<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Category;
use App\Models\Product;

class ProductEditComponent extends Component
{
    public $categories = [];
    public $product;

    public function mount($id)
    {
        $this->categories = Category::all();
        $this->product = Product::findOrFail($id);
    }

    public function render()
    {
        return view('livewire.dashboard.product-edit-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.product_edit')]);
    }
}
