<?php

namespace App\Livewire\Dashboard\AppointmentService;

use App\Application\Appointment\Commands\AddServiceToAppointmentCommand;
use App\Application\Appointment\DTOs\AddServiceToAppointmentData;
use App\Models\Appointment;
use Livewire\Component;

class CreateAppointmentService extends Component
{
    public $appointment;

    public $services;

    public function addService($service)
    {
        $model = Appointment::findOrFail($this->appointment);
        $this->authorize('manageServices', $model);

        $result = app(AddServiceToAppointmentCommand::class)->handle(
            new AddServiceToAppointmentData((int) $this->appointment, (int) $service)
        );

        if ($result['created']) {
            $this->dispatch('notification-success', [
                'type' => 'success',
                'title' => 'Acción exitosa!',
                'body' => 'Servicio añadido',
            ]);

        } else {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'Ya existe el servicio en la agenda',
            ]);
        }

        $this->dispatch('refresh-appointment-services');
    }
}
