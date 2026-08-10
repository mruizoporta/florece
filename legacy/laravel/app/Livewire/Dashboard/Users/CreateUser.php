<?php

namespace App\Livewire\Dashboard\Users;

use Livewire\Component;
use App\Livewire\Forms\Dashboard\User\CreateForm;

class CreateUser extends Component
{
    public CreateForm $form;

    public function save()
    {
        $this->form->store();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Usuario ingresado'
        ]);

        $this->js("window.dispatchEvent(new CustomEvent('close-user-create-modal'))");

        $this->dispatch('refresh-users');
    }
}
