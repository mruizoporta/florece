<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;
use Carbon\Carbon;

class CustomerHasPendingAppointmentQuery
{
    public function execute(int $customerId): bool
    {
        return Appointment::query()
            ->where('customer_id', $customerId)
            ->where('status_id', 2)
            ->whereDate('start_time', '>', Carbon::now())
            ->exists();
    }
}
