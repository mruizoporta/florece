<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\RescheduleAppointmentData;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Domain\Appointment\ScheduleAvailabilityChecker;
use App\Domain\Employees\Exceptions\InactiveEmployeeForAppointmentException;
use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class RescheduleAppointmentCommand
{
    public function __construct(
        private readonly ScheduleAvailabilityChecker $scheduleAvailabilityChecker,
    ) {}

    public function handle(RescheduleAppointmentData $data): Appointment
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        if (! (bool) $employee->status) {
            throw InactiveEmployeeForAppointmentException::forEmployee((int) $employee->id);
        }

        return DB::transaction(function () use ($data) {
            $appointment = Appointment::query()->lockForUpdate()->findOrFail($data->appointmentId);

            $date = $data->startTime->format('Y-m-d');
            $timeStr = $data->startTime->format('H:i');
            $durationMinutes = (int) $data->startTime->diffInMinutes($data->endTime);

            if (! $this->scheduleAvailabilityChecker->isAvailable(
                $data->employeeId,
                $date,
                $timeStr,
                $durationMinutes,
                $data->appointmentId
            )) {
                throw SlotNotAvailableException::forRequestedSlot();
            }

            $appointment->update([
                'employee_id' => $data->employeeId,
                'start_time' => $data->startTime,
                'end_time' => $data->endTime,
            ]);

            return $appointment->fresh();
        });
    }
}
