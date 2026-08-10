<?php

namespace App\Livewire\Actions\Dashboard\Appointment;

use App\Application\Appointment\Commands\ChangeAppointmentStatusCommand;
use App\Application\Appointment\DTOs\ChangeAppointmentStatusData;

class FinishAppointmentAction
{
    public function handle($appointment)
    {
        return app(ChangeAppointmentStatusCommand::class)->handle(
            new ChangeAppointmentStatusData((int) $appointment, 5)
        );
    }
}
