<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class CalendarComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.calendar-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.calendar')]);
    }
}
