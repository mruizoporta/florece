<?php

namespace App\Domain\Appointment;

use Carbon\Carbon;

class CustomerCancellationWindow
{
    public function canCancel(?Carbon $startTime, ?Carbon $now = null): bool
    {
        if ($startTime === null) {
            return false;
        }

        $current = $now ?? Carbon::now();

        return $current->diffInHours($startTime, false) >= 6;
    }
}
