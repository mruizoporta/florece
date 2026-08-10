<?php

namespace App\Livewire\Forms\Dashboard\Product;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Product\UpdateLongDescriptionAction;

use App\Models\Product;

class UpdateLongDescriptionForm extends Form
{
    public ?Product $product;

    public function setProduct($product)
    {
        $this->product = $product;
    }

    public function update($data)
    {
        UpdateLongDescriptionAction::handle($this->product->id, $data);
    }
}
