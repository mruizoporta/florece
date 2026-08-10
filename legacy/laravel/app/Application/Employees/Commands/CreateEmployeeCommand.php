<?php

namespace App\Application\Employees\Commands;

use App\Application\Employees\DTOs\CreateEmployeeData;
use App\Models\Employee;
use App\Models\Tenant;

class CreateEmployeeCommand
{
    public function handle(CreateEmployeeData $data): Employee
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        if (trim($data->name) === '') {
            throw new \InvalidArgumentException('El nombre del empleado es obligatorio.');
        }

        return Employee::query()->create([
            'name' => $data->name,
            'description' => $data->description,
            'image' => $data->image,
            'status' => $data->status,
            'visible_public' => $data->visiblePublic,
        ]);
    }
}

