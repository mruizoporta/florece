<?php

namespace App\Domain\Appointment;

use App\Models\Appointment;
use Carbon\Carbon;

/**
 * Comprueba solapamiento con citas existentes (misma lógica que el flujo previo en Livewire).
 */
class ScheduleAvailabilityChecker
{
    /**
     * @param  int|null  $excludeAppointmentId  Excluir cita al reprogramar (misma lógica de solapes).
     */
    public function isAvailable(int $employeeId, string $date, string $startTime, int $serviceDurationInMinutes, ?int $excludeAppointmentId = null): bool
    {
        $dateTime = Carbon::parse("$date $startTime");
        $endTime = $dateTime->copy()->addMinutes($serviceDurationInMinutes);

        $existingAppointments = Appointment::where('employee_id', $employeeId)
            ->whereDate('start_time', '=', $dateTime->toDateString())
            ->where('status_id', '!=', 1)
            ->when($excludeAppointmentId !== null, fn ($q) => $q->where('id', '!=', $excludeAppointmentId))
            ->get();

        $hasConflict = $existingAppointments->contains(function ($appointment) use ($dateTime, $endTime) {
            $existingStart = Carbon::parse($appointment->start_time);
            $existingEnd = Carbon::parse($appointment->end_time);

            return $dateTime->between($existingStart, $existingEnd->subMinute())
                || $endTime->between($existingStart->addMinute(), $existingEnd);
        });

        return ! $hasConflict;
    }
}
