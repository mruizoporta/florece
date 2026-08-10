<?php

namespace App\Livewire\Actions\Dashboard\Appointment;

use App\Application\Appointment\Commands\ChangeAppointmentStatusCommand;
use App\Application\Appointment\DTOs\ChangeAppointmentStatusData;

class AttendCustomerAction
{
    public function handle($appointment, $duration)
    {
        return app(ChangeAppointmentStatusCommand::class)->handle(
            new ChangeAppointmentStatusData((int) $appointment, 4, (int) $duration)
        );
    }
}
