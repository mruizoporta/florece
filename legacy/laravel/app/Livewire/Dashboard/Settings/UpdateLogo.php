<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Setting\UpdateLogoForm;

class UpdateLogo extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateLogoForm $form;

    public function mount($logo)
    {
        $this->form->setLogo($logo);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Logo actualizado'
        ]);
    }
}
