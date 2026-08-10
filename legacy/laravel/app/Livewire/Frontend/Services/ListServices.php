<?php

namespace App\Livewire\Frontend\Services;

use Livewire\Component;
use App\Livewire\Traits\ImageTrait;

use App\Models\Service;

class ListServices extends Component
{
    use ImageTrait;

    public $services = [];

    public $currency_symbol;

    public $titles_color;

    public $buttons_background_color;

    public $buttons_text_color;

    public function mount()
    {
        $this->services = Service::with('item')->get();
    }
}
