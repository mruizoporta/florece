<?php

namespace App\Livewire\Dashboard\Products;

use Livewire\Component;
use Livewire\Attributes\On;

use App\Livewire\Forms\Dashboard\Product\UpdateLongDescriptionForm;

class UpdateLongDescription extends Component
{
    public UpdateLongDescriptionForm $form;

    public $product;

    public function mount($product)
    {
        $this->form->setProduct($product);
        $this->dispatch('load-ckeditor-content', content: $product->long_description);
    }

    #[On('getLongDescription')]
    public function updateLongDescription($data)
    {
        $this->form->update($data);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Detalles actualizados'
        ]);
    }
}
