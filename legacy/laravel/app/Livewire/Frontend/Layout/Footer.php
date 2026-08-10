<?php

namespace App\Livewire\Frontend\Layout;

use Livewire\Component;
use App\Livewire\Traits\ImageTrait;

use App\Models\Setting;

class Footer extends Component
{
    use ImageTrait;

    public $setting = [];

    public function mount()
    {
        $this->setting = Setting::first();
    }
}
