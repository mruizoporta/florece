<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class ServiceComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.service-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.services')]);
    }
}
