<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class AppointmentComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.appointment-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.appointments')]);
    }
}
