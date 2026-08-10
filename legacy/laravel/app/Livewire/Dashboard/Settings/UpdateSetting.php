<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;

use App\Livewire\Forms\Dashboard\Setting\UpdateForm;

class UpdateSetting extends Component
{
    public UpdateForm $form;

    public function mount($setting)
    {
        $this->form->setSetting($setting);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Configuración actualizada'
        ]);
    }
}
