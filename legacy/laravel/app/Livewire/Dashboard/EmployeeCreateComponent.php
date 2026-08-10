<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class EmployeeCreateComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.employee-create-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.employee_new')]);
    }
}
