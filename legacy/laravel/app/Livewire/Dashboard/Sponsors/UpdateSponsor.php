<?php

namespace App\Livewire\Dashboard\Sponsors;

use Livewire\Component;
use Livewire\WithFileUploads;
use Livewire\Attributes\On;

use App\Livewire\Traits\ImageTrait;

use App\Models\Sponsor;

use App\Livewire\Forms\Dashboard\Sponsor\UpdateForm;

class UpdateSponsor extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateForm $form;

    #[On('edit-sponsor')]
    public function edit(Sponsor $sponsor)
    {
        $this->form->setSponsor($sponsor);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Sponsor actualizado'
        ]);

        $this->dispatch('refresh-sponsors');
    }
}
