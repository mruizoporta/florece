<?php

namespace App\Livewire\Forms\Dashboard\Product;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Product\UpdateAction;

use App\Models\Product;

class UpdateForm extends Form
{
    public ?Product $product;

    #[Rule('required|integer|min:0', as: 'stock')]
    public int $stock;

    #[Rule('required|integer|min:0', as: 'alerta de stock')]
    public int $stock_alert;

    public function setProduct($product)
    {
        $this->product = $product;
        $this->stock = $product->stock;
        $this->stock_alert = $product->stock_alert;
    }

    public function update()
    {
        UpdateAction::handle($this->product->id, $this->stock, $this->stock_alert);
    }
}
