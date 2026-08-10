<?php

namespace App\Livewire\Forms\Dashboard\Setting;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateAction;

class UpdateForm extends Form
{
    public ?Setting $setting;

    #[Rule('required|string|max:75', as: 'nombre de empresa')]
    public $company_name;

    #[Rule('required|email|max:75', as: 'correo')]
    public $mail_contact;

    #[Rule('required|string|max:75', as: 'localidad')]
    public $location;

    #[Rule('required|string|max:75', as: 'dirección')]
    public $address;

    #[Rule('nullable|string|max:25', as: 'teléfono')]
    public $phone;

    #[Rule('required|string|max:7', as: 'símbolo')]
    public $currency_symbol;

    #[Rule('nullable|max:255', as: 'instagram url')]
    public $instagram_href;

    #[Rule('nullable|max:255', as: 'sobre nosotros')]
    public $about_us;

    #[Rule('nullable|max:75', as: 'horario')]
    public $schedules;

    public function setSetting($setting)
    {
        $this->company_name = $setting->company_name;
        $this->mail_contact = $setting->mail_contact;
        $this->location = $setting->location;
        $this->address = $setting->address;
        $this->phone = $setting->phone;
        $this->currency_symbol = $setting->currency_symbol;
        $this->instagram_href = $setting->instagram_href;
        $this->about_us = $setting->about_us;
        $this->schedules = $setting->schedules;
    }

    public function update()
    {
        UpdateAction::handle($this->company_name, $this->mail_contact, $this->location, $this->address, $this->phone, $this->currency_symbol, $this->instagram_href, $this->about_us, $this->schedules);
    }
}
