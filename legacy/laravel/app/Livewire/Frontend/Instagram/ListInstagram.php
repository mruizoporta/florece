<?php

namespace App\Livewire\Frontend\Instagram;

use Livewire\Component;

use App\Models\InstagramFeed;

class ListInstagram extends Component
{
    public $instagram = [];

    public $instagram_href;

    public function mount()
    {
        $this->instagram = InstagramFeed::all();
    }
}
