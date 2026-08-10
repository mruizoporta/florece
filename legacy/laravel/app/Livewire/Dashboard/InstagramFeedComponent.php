<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class InstagramFeedComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.instagram-feed-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.instagram')]);
    }
}
