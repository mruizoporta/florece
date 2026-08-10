<?php

namespace App\Application\Employees\Queries;

use App\Models\Employee;

class GetEmployeeDetailQuery
{
    public function execute(int $employeeId): Employee
    {
        return Employee::query()
            ->with(['schedules', 'socials'])
            ->findOrFail($employeeId);
    }
}

