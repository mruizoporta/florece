<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;
use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateBannerAction;

class UpdateBannerForm extends Form
{
    #[Rule('required|image|mimes:jpg,jpeg,png,webp|max:2048|dimensions:min_width=1920', as: 'banner')]
    public $banner = '';

    public $currentBanner = '';

    public function setBanner($currentBanner)
    {
        $this->currentBanner = $currentBanner;
    }

    public function update()
    {
        $banner = ImageService::upload('storage/banners/', $this->banner);
        UpdateBannerAction::handle($banner);
        $this->reset('banner');
        $this->currentBanner = $banner;
        return $banner;
    }
}
