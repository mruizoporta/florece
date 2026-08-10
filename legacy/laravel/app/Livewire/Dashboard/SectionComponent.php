<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Section;

class SectionComponent extends Component
{
    public $sections = [];

    public function mount()
    {
        $this->sections = Section::first();
    }

    public function render()
    {
        return view('livewire.dashboard.section-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.styles')]);
    }
}
