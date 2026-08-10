<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class AppointmentCreateComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.appointment-create-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.appointment_new')]);
    }
}
