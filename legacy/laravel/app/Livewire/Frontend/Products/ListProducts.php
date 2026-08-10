<?php

namespace App\Livewire\Frontend\Products;

use Livewire\Component;

use App\Livewire\Traits\ImageTrait;

use App\Models\Product;

class ListProducts extends Component
{
    use ImageTrait;

    public $products = [];

    public $currency_symbol;

    public function mount()
    {
        $this->products = Product::with('item')->inRandomOrder()->take(8)->get();
    }

    public function showProduct($product_id)
    {
        $this->dispatch('show-product', $product_id);
    }
}
