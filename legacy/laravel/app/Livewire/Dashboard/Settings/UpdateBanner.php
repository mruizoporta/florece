<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;
use Livewire\WithFileUploads;
use App\Livewire\Traits\ImageTrait;

use App\Livewire\Forms\Dashboard\Setting\UpdateBannerForm;

class UpdateBanner extends Component
{
    use ImageTrait;
    use WithFileUploads;

    public UpdateBannerForm $form;

    public function mount($banner)
    {
        $this->form->setBanner($banner);
    }

    public function save()
    {
        $this->validate();

        $this->form->update();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Banner actualizado'
        ]);
    }
}
