<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateLogoAction;

class UpdateLogoForm extends Form
{
    #[Rule('required|image|mimes:jpg,jpeg,png,webp|max:2048', as: 'logo')]
    public $logo = '';

    public $currentLogo = '';

    public function setLogo($currentLogo)
    {
        $this->currentLogo = $currentLogo;
    }

    public function update()
    {
        $logo = ImageService::upload('storage/logo/', $this->logo);
        UpdateLogoAction::handle($logo);
        $this->reset('logo');
        $this->currentLogo = $logo;
        return $logo;
    }
}
