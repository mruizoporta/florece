<?php

namespace App\Livewire\Dashboard\Appointments;

use App\Livewire\Forms\Dashboard\Appointment\CreateSimpleForm;
use Livewire\Component;

class CreateSimpleAppointment extends Component
{
    public CreateSimpleForm $form;

    public function save()
    {
        $this->validate();

        $this->form->store();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Agenda ingresada',
        ]);

        $this->js("window.dispatchEvent(new CustomEvent('close-simple-appointment-modal'))");

        $this->dispatch('refresh-appointments');
    }
}
