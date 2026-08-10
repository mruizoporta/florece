<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;

class HasAppointmentsQuery
{
    public function execute(): bool
    {
        return Appointment::query()->exists();
    }
}
