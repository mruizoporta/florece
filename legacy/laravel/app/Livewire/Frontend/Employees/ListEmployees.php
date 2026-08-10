<?php

namespace App\Livewire\Frontend\Employees;

use Livewire\Component;
use App\Livewire\Traits\ImageTrait;

use App\Models\Employee;

class ListEmployees extends Component
{
    use ImageTrait;

    public $employees = [];

    public $titles_color;

    public function mount()
    {
        $this->employees = Employee::with('socials')->where('status', true)->get();
    }
}
