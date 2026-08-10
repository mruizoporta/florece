<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Setting\UpdateImageParallaxForm;

class UpdateImageParallax extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateImageParallaxForm $form;

    public function mount($image_parallax)
    {
        $this->form->setImageParallax($image_parallax);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Imagen actualizada'
        ]);
    }
}
