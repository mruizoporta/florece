<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;

class IsEmployeeAttendingQuery
{
    public function execute(int $employeeId): bool
    {
        return Appointment::query()
            ->where('employee_id', $employeeId)
            ->where('status_id', 4)
            ->exists();
    }
}
