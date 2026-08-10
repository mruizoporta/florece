<?php

namespace App\Livewire\Dashboard\Products;

use Livewire\Component;
use App\Livewire\Forms\Dashboard\Product\UpdateForm;

use App\Models\Product;

class UpdateProduct extends Component
{
    public UpdateForm $form;

    public function mount(Product $product)
    {
        $this->form->setProduct($product);
    }

    public function updateStock()
    {
        $this->updated();
    }

    public function updateStockAlert()
    {
        $this->updated();
    }

    public function updated()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Producto actualizado'
        ]);
    }
}
