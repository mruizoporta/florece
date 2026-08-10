<?php

namespace App\Application\Employees\Commands;

use App\Application\Employees\DTOs\ArchiveEmployeeData;
use App\Models\Employee;
use App\Models\Tenant;

class ArchiveEmployeeCommand
{
    public function handle(ArchiveEmployeeData $data): Employee
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        $employee->update([
            'status' => false,
            'visible_public' => false,
        ]);

        return $employee->fresh();
    }
}

