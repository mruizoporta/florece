<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateImageRightAction;

class UpdateImageRightForm extends Form
{
    #[Rule('required|image|mimes:jpg,jpeg,png,webp|max:2048', as: 'imagen')]
    public $image_right = '';

    public $currentImageRight = '';

    public function setImageRight($currentImageRight)
    {
        $this->currentImageRight = $currentImageRight;
    }

    public function update()
    {
        $image_right = ImageService::upload('storage/landing/', $this->image_right);
        UpdateImageRightAction::handle($image_right);
        $this->reset('image_right');
        $this->currentImageRight = $image_right;
        return $image_right;
    }
}
