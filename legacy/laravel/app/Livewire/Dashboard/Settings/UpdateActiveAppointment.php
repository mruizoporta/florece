<?php

namespace App\Livewire\Dashboard\Settings;

use Livewire\Component;

use Facades\App\Livewire\Actions\Dashboard\Setting\UpdateActiveAppointmentAction;

use App\Models\Setting;

class UpdateActiveAppointment extends Component
{
    public function changeStatus()
    {
       $newValue = UpdateActiveAppointmentAction::handle();

       if($newValue){
            return $this->dispatch('notification-success', [
                'type' => 'success',
                'title' => 'Acción exitosa!',
                'body' => 'Agenda activada'
            ]);
       }

       $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Agenda desactivada'
        ]);
    }

    public function render()
    {
        return view('livewire.dashboard.settings.update-active-appointment')->with([
            'active_appointment' => Setting::value('active_appointment')
        ]);
    }
}
