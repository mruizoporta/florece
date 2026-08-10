<?php

namespace App\Livewire\Dashboard;

use Livewire\Component;

use App\Models\Category;
use App\Models\Service;

class ServiceEditComponent extends Component
{
    public $categories = [];
    public $service;

    public function mount($id)
    {
        $this->categories = Category::all();
        $this->service = Service::findOrFail($id);
    }

    public function render()
    {
        return view('livewire.dashboard.service-edit-component')
            ->extends('layouts.dashboard-new', ['title' => __('app.page.title.service_edit')]);
    }
}
