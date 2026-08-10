<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class SponsorComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.sponsor-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.sponsors')]);
    }
}
