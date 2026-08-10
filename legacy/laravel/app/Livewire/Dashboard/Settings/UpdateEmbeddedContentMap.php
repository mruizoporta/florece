<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use App\Livewire\Forms\Dashboard\Setting\UpdateEmbeddedContentMapForm;

class UpdateEmbeddedContentMap extends Component
{
    public UpdateEmbeddedContentMapForm $form;

    public function mount($embedded_content_map)
    {
        $this->form->setEmbeddedContentMap($embedded_content_map);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Mapa actualizado'
        ]);
    }
}
