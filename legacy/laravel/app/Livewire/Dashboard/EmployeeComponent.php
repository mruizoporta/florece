<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class EmployeeComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.employee-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.employees')]);
    }
}
