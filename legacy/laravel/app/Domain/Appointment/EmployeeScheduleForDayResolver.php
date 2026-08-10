<?php

namespace App\Domain\Appointment;

use App\Models\Schedule;
use Carbon\Carbon;

class EmployeeScheduleForDayResolver
{
    public function resolve(int $employeeId, Carbon $day): ?Schedule
    {
        $dayOfWeek = $day->dayOfWeek;
        if ($dayOfWeek === 0) {
            $dayOfWeek = 7;
        }

        return Schedule::query()
            ->where('employee_id', $employeeId)
            ->where('weekday', $dayOfWeek)
            ->where('status', true)
            ->first();
    }
}
