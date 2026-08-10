<?php

namespace App\Livewire\Frontend\Products;

use Livewire\Attributes\On;
use Livewire\Component;

use Illuminate\Support\Facades\Redirect;

use App\Livewire\Traits\ImageTrait;

use App\Models\Product;

class ShowProduct extends Component
{
    use ImageTrait;

    public $product;

    public $whatsapp;

    #[On('show-product')]
    public function showProduct($product_id)
    {
        $this->product = Product::with('item')
            ->with('images')
            ->findOrFail($product_id);
    }
}
