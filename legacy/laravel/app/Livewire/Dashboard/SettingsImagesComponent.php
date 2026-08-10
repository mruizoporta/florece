<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Setting;

class SettingsImagesComponent extends Component
{
    public $setting = [];

    public function mount()
    {
        $this->setting = Setting::first();
    }

    public function render()
    {
        return view('livewire.dashboard.settings-images-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.settings_images')]);
    }
}
