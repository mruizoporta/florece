<?php

namespace App\Livewire\Dashboard\Images;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Image\CreateForm;

class CreateImage extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public CreateForm $form;

    public $product;

    public function mount($product)
    {
        $this->form->setProduct($product);
    }

    public function save()
    {
        $this->validate();

        $image = $this->form->store();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Imagen añadida'
        ]);

        $this->dispatch('refresh-images');
    }
}
