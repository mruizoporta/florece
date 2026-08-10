<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Setting\UpdateImageRightForm;

class UpdateImageRight extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateImageRightForm $form;

    public function mount($image_right)
    {
        $this->form->setImageRight($image_right);
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
