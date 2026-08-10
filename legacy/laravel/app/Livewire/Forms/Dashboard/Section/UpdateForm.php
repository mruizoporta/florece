<?php

namespace App\Livewire\Forms\Dashboard\Section;

use Livewire\Attributes\Rule;
use Livewire\Form;

use Facades\App\Livewire\Actions\Dashboard\Section\UpdateAction;
use Facades\App\Livewire\Actions\Dashboard\Section\UpdateShowSectionAction;

use App\Models\Section;

class UpdateForm extends Form
{
    public ?Section $section;

    public string $about_us_show_section;

    #[Rule('required|max:25', as: 'título')]
    public string $about_us_text;

    #[Rule('required|max:75', as: 'icono')]
    public string $about_us_icon;



    public string $employees_show_section;

    #[Rule('required|max:25', as: 'título')]
    public string $employees_text;

    #[Rule('required|max:75', as: 'icono')]
    public string $employees_icon;



    public string $services_show_section;

    #[Rule('required|max:25', as: 'título')]
    public string $services_text;

    #[Rule('required|max:75', as: 'icono')]
    public string $services_icon;



    public string $products_show_section;

    #[Rule('required|max:25', as: 'título')]
    public string $products_text;

    #[Rule('required|max:75', as: 'icono')]
    public string $products_icon;



    public string $instagram_show_section;

    #[Rule('required|max:25', as: 'título')]
    public string $instagram_text;

    #[Rule('required|max:75', as: 'icono')]
    public string $instagram_icon;



    public string $whatsapp_show_section;

    #[Rule('required|max:75', as: 'título 1')]
    public string $whatsapp_title_1;

    #[Rule('required|max:75', as: 'título 2')]
    public string $whatsapp_title_2;

    #[Rule('required|max:75', as: 'título 3')]
    public string $whatsapp_title_3;

    #[Rule('required|max:75', as: 'icono')]
    public string $whatsapp_icon;

    #[Rule('required|max:25', as: 'texto del botón')]
    public string $btn_whatsapp_button_text;


    public function setSection($section)
    {
        $this->about_us_show_section = $section->about_us_show_section;
        $this->about_us_text = $section->about_us_text;
        $this->about_us_icon = $section->about_us_icon;
        $this->employees_show_section = $section->employees_show_section;
        $this->employees_text = $section->employees_text;
        $this->employees_icon = $section->employees_icon;
        $this->services_show_section = $section->services_show_section;
        $this->services_text = $section->services_text;
        $this->services_icon = $section->services_icon;
        $this->products_show_section = $section->products_show_section;
        $this->products_text = $section->products_text;
        $this->products_icon = $section->products_icon;
        $this->instagram_show_section = $section->instagram_show_section;
        $this->instagram_text = $section->instagram_text;
        $this->instagram_icon = $section->instagram_icon;
        $this->whatsapp_show_section = $section->whatsapp_show_section;
        $this->whatsapp_title_1 = $section->whatsapp_title_1;
        $this->whatsapp_title_2 = $section->whatsapp_title_2;
        $this->whatsapp_title_3 = $section->whatsapp_title_3;
        $this->whatsapp_icon = $section->whatsapp_icon;
        $this->btn_whatsapp_button_text = $section->btn_whatsapp_button_text;
    }

    public function update($field, $value)
    {
        UpdateAction::handle($field, $value);
    }

    public function updateShowSection($field)
    {
        UpdateShowSectionAction::handle($field);
    }
}
