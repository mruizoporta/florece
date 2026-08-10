<?php

namespace App\Livewire\Frontend;

use Livewire\Component;

class ProfileComponent extends Component
{
    public function render()
    {
        return view('livewire.frontend.profile-component')
            ->extends('layouts.frontend', ['title' => __('app.page.title.profile')]);
    }
}
