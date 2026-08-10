<?php

namespace App\Livewire\Frontend;

use Livewire\Component;

use App\Livewire\Traits\ImageTrait;

use App\Models\Section;
use App\Models\Setting;

class WelcomeComponent extends Component
{
    use ImageTrait;

    public function render()
    {
        return view('welcome')->with([
            'section' => Section::first(),
            'setting' => Setting::first()
        ])
            ->extends('layouts.frontend', ['title' => __('app.page.title.home')]);
    }
}
