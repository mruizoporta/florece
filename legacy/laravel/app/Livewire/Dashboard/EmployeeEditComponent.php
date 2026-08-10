<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Employee;

class EmployeeEditComponent extends Component
{
    public $employee;

    public function mount($id)
    {
        $this->employee = Employee::findOrFail($id);
    }

    public function render()
    {
        return view('livewire.dashboard.employee-edit-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.employee_edit')]);
    }
}
