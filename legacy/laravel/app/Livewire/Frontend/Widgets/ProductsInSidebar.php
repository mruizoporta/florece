<?php

namespace App\Livewire\Frontend\Widgets;

use Livewire\Component;

use App\Livewire\Traits\ImageTrait;

use App\Models\Product;

class ProductsInSidebar extends Component
{
    use ImageTrait;

    public $excludeProductId;

    public function render()
    {
        return view('livewire.frontend.widgets.products-in-sidebar')->with([
            'products' => Product::whereNotIn('id', [$this->excludeProductId])->inRandomOrder()->limit(5)->get()
        ]);
    }
}
