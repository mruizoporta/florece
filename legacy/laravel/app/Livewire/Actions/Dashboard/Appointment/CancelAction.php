<?php

namespace App\Livewire\Actions\Dashboard\Appointment;

use App\Application\Appointment\Commands\CancelAppointmentCommand;
use App\Application\Appointment\DTOs\CancelAppointmentData;

class CancelAction
{
    public function handle($appointment)
    {
        return app(CancelAppointmentCommand::class)->handle(
            new CancelAppointmentData((int) $appointment)
        );
    }
}
