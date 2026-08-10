<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateAppointmentTypeAction;

use App\Models\Setting;

class UpdateAppointmentType extends Component
{
    public function changeAppointmentType($type)
    {

        if($type == 'blacklist' || $type == 'whitelist'){

            UpdateAppointmentTypeAction::handle($type);

            return $this->dispatch('notification-success', [
                'type' => 'success',
                'title' => 'Acción exitosa!',
                'body' => 'Se modificó a *' . $type . '*'
            ]);
        }

        return $this->dispatch('notification-warning', [
            'type' => 'warning',
            'title' => 'Algo salió mal!',
            'body' => 'Recárgue la página para intentarlo nuevamente.'
        ]);
    }

    public function render()
    {
        return view('livewire.dashboard.settings.update-appointment-type')->with([
            'appointment_type' => Setting::value('appointment_type')
        ]);
    }
}
