<?php

namespace App\Livewire\Frontend\Partials;

use Livewire\Component;

use App\Models\Setting;

class Settings extends Component
{
    public $setting = [];

    public function mount()
    {
        $this->setting = Setting::first();
    }
}
