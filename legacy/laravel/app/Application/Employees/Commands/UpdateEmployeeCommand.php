<?php

namespace App\Application\Employees\Commands;

use App\Application\Employees\DTOs\UpdateEmployeeData;
use App\Models\Employee;
use App\Models\Tenant;

class UpdateEmployeeCommand
{
    public function handle(UpdateEmployeeData $data): Employee
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if (trim($data->name) === '') {
            throw new \InvalidArgumentException('El nombre del empleado es obligatorio.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        $employee->update([
            'name' => $data->name,
            'description' => $data->description,
            'image' => $data->image,
            'status' => $data->status,
            'visible_public' => $data->visiblePublic,
        ]);

        return $employee->fresh();
    }
}

