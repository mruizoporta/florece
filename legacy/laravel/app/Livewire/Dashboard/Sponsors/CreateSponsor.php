<?php

namespace App\Livewire\Dashboard\Sponsors;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Forms\Dashboard\Sponsor\CreateForm;

class CreateSponsor extends Component
{
    use WithFileUploads;
    public CreateForm $form;

    public function save()
    {
        $this->validate();

        $this->form->store();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Sponsor ingresado'
        ]);

        $this->dispatch('refresh-sponsors');
    }
}
