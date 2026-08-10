<?php

namespace App\Livewire\Forms\Dashboard\Instagram;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Instagram\CreateAction;

class CreateForm extends Form
{
    public ?InstagramFeed $instagram_feed;

    #[Rule('required', as: 'contenido embebido')]
    public string $content = '';

    public function store()
    {
        CreateAction::handle($this->content);
        $this->reset();
    }
}
