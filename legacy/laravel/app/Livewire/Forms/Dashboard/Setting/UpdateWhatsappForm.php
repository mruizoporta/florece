<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateWhatsappAction;

class UpdateWhatsappForm extends Form
{
    #[Rule('required|numeric|max:999999999999999', as: 'whatsapp')]
    public $whatsapp;

    public function setWhatsapp($whatsapp)
    {
        $this->whatsapp = $whatsapp;
    }

    public function update()
    {
        UpdateWhatsappAction::handle($this->whatsapp);
    }
}
