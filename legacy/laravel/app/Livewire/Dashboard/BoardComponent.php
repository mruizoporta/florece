<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

class BoardComponent extends Component
{
    public function render()
    {
        return view('livewire.dashboard.board-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.board')]);
    }
}
