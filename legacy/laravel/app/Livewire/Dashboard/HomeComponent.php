<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class HomeComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.home-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.home')]);
    }
}
