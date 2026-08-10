<?php

namespace App\Livewire\Frontend\Partials;

use Livewire\Component;

use App\Models\Setting;

class BtnWhatsapp extends Component
{
    public function render()
    {
        return view('livewire.frontend.partials.btn-whatsapp')->with([
            'whatsapp' => Setting::value('whatsapp')
        ]);
    }
}
