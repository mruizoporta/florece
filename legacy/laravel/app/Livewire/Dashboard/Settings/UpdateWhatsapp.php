<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use App\Livewire\Forms\Dashboard\Setting\UpdateWhatsappForm;

class UpdateWhatsapp extends Component
{
    public UpdateWhatsappForm $form;

    public function mount($whatsapp)
    {
        $this->form->setWhatsapp($whatsapp);
    }

    public function update()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Whatsapp actualizado'
        ]);
    }
}
