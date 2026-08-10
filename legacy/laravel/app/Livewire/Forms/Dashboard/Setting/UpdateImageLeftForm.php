<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateImageLeftAction;

class UpdateImageLeftForm extends Form
{
    #[Rule('required|image|mimes:jpg,jpeg,png,webp|max:2048', as: 'imagen')]
    public $image_left = '';

    public $currentImageLeft = '';

    public function setImageLeft($currentImageLeft)
    {
        $this->currentImageLeft = $currentImageLeft;
    }

    public function update()
    {
        $image_left = ImageService::upload('storage/landing/', $this->image_left);
        UpdateImageLeftAction::handle($image_left);
        $this->reset('image_left');
        $this->currentImageLeft = $image_left;
        return $image_left;
    }
}
