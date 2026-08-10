<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\CreateAppointmentData;
use App\Application\Appointment\DTOs\SyncAppointmentServicesData;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Domain\Appointment\ScheduleAvailabilityChecker;
use App\Domain\Employees\Exceptions\InactiveEmployeeForAppointmentException;
use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class CreateAppointmentCommand
{
    public function __construct(
        private readonly ScheduleAvailabilityChecker $scheduleAvailabilityChecker,
    ) {}

    public function handle(CreateAppointmentData $data): Appointment
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        if (! (bool) $employee->status) {
            throw InactiveEmployeeForAppointmentException::forEmployee((int) $employee->id);
        }

        $serviceIds = array_values(array_unique(array_map('intval', $data->serviceIds)));
        if (count($serviceIds) !== Service::query()->whereIn('id', $serviceIds)->count()) {
            throw new \InvalidArgumentException('Uno o más servicios no son válidos para este salón.');
        }

        $date = $data->startTime->format('Y-m-d');
        $timeStr = $data->startTime->format('H:i');
        $durationMinutes = (int) $data->startTime->diffInMinutes($data->endTime);

        if (! $this->scheduleAvailabilityChecker->isAvailable($data->employeeId, $date, $timeStr, $durationMinutes)) {
            throw SlotNotAvailableException::forRequestedSlot();
        }

        return DB::transaction(function () use ($data, $serviceIds) {
            $appointment = Appointment::create([
                'customer_id' => $data->customerId,
                'status_id' => $data->statusId,
                'type_id' => $data->typeId,
                'name' => $data->name,
                'employee_id' => $data->employeeId,
                'phone' => $data->phone,
                'start_time' => $data->startTime,
                'end_time' => $data->endTime,
            ]);

            app(SyncAppointmentServicesCommand::class)->handle(
                new SyncAppointmentServicesData($appointment->id, $serviceIds)
            );

            return $appointment->fresh();
        });
    }
}
