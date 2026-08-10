<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\ChangeAppointmentEmployeeData;
use App\Domain\Employees\Exceptions\InactiveEmployeeForAppointmentException;
use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Tenant;

class ChangeAppointmentEmployeeCommand
{
    public function handle(ChangeAppointmentEmployeeData $data): Appointment
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        if (! (bool) $employee->status) {
            throw InactiveEmployeeForAppointmentException::forEmployee((int) $employee->id);
        }

        $appointment = Appointment::query()->findOrFail($data->appointmentId);
        $appointment->update([
            'employee_id' => $data->employeeId,
        ]);

        return $appointment->fresh();
    }
}
