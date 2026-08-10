<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class UserComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.user-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.users')]);
    }
}
