<?php

namespace App\Livewire\Forms\Dashboard\Sponsor;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Services\Dashboard\ImageService;

use Facades\App\Livewire\Actions\Dashboard\Sponsor\CreateAction;

class CreateForm extends Form
{
    #[Rule('required|string|max:75|unique:sponsors,name', as: 'nombre')]
    public string $name = '';

    #[Rule('required|mimes:jpg,jpeg,png,webp|max:2048', as: 'imagen')]
    public $image = '';

    public function store()
    {
        $image = ImageService::upload('storage/sponsors/', $this->image);

        $sponsor = CreateAction::handle($this->name, $image);

        $this->reset();
    }
}
