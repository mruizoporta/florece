<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateImageParallaxAction;

class UpdateImageParallaxForm extends Form
{
    #[Rule('required|image|mimes:jpg,jpeg,png,webp|max:2048', as: 'imagen')]
    public $image_parallax = '';

    public $currentImageParallax = '';

    public function setImageParallax($currentImageParallax)
    {
        $this->currentImageParallax = $currentImageParallax;
    }

    public function update()
    {
        $image_parallax = ImageService::upload('storage/landing/', $this->image_parallax);
        UpdateImageParallaxAction::handle($image_parallax);
        $this->reset('image_parallax');
        $this->currentImageParallax = $image_parallax;
        return $image_parallax;
    }
}
