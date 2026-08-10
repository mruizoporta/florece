<?php

namespace App\Livewire\Frontend\Sponsors;

use Livewire\Component;
use App\Livewire\Traits\ImageTrait;

use App\Models\Sponsor;

class ListSponsors extends Component
{
    use ImageTrait;

    public $sponsors = [];

    public function mount()
    {
        $this->sponsors = Sponsor::all();
    }
}
