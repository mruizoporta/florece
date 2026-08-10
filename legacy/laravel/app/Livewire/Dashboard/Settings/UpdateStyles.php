<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateFieldAction;

use App\Models\Setting;

class UpdateStyles extends Component
{
    public string $buttons_background_color;
    public string $buttons_text_color;
    public string $titles_color;
    public string $icons_color;
    public string $btn_whatsapp_background_color;
    public string $btn_whatsapp_text_color;
    public string $footer_background_color;
    public string $footer_text_color;

    public function mount()
    {
        $settings = Setting::first();

        $this->buttons_background_color = '#' . $settings->buttons_background_color;
        $this->buttons_text_color = '#' . $settings->buttons_text_color;
        $this->titles_color = '#' . $settings->titles_color;
        $this->icons_color = '#' . $settings->icons_color;
        $this->btn_whatsapp_background_color = '#' . $settings->btn_whatsapp_background_color;
        $this->btn_whatsapp_text_color = '#' . $settings->btn_whatsapp_text_color;
        $this->footer_background_color = '#' . $settings->footer_background_color;
        $this->footer_text_color = '#' . $settings->footer_text_color;
    }

    public function updated($field)
    {
        $value = substr($this->$field, 1);

        UpdateFieldAction::handle($field, $value);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Color actualizado'
        ]);
    }
}
