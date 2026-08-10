<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateEmbeddedContentMapAction;

class UpdateEmbeddedContentMapForm extends Form
{
    #[Rule('required|string|regex:/<iframe.*src="https:\/\/www\.google\.com\/maps\/embed\?.*<\/iframe>/', as: 'Contenido embebido')]
    public $embedded_content_map;

    public function setEmbeddedContentMap($embedded_content_map)
    {
        $this->embedded_content_map = $embedded_content_map;
    }

    public function update()
    {
        UpdateEmbeddedContentMapAction::handle($this->embedded_content_map);
    }
}
