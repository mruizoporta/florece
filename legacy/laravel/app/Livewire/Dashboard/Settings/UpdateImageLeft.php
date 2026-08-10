<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Setting\UpdateImageLeftForm;

class UpdateImageLeft extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateImageLeftForm $form;

    public function mount($image_left)
    {
        $this->form->setImageLeft($image_left);
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
