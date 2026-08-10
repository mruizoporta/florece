<?php

namespace App\Livewire\Dashboard\Instagram;

use Livewire\Component;
use App\Livewire\Forms\Dashboard\Instagram\CreateForm;

class CreateInstagramFeed extends Component
{
    public CreateForm $form;

    public function save()
    {
        $this->validate();

        $this->form->store();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Feed ingresado'
        ]);

        $this->dispatch('refresh-instagram-feeds');
    }
}
