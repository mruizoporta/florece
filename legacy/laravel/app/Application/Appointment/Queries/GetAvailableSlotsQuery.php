<?php

namespace App\Application\Appointment\Queries;

use App\Application\Appointment\Results\GetAvailableSlotsResult;
use App\Domain\Appointment\EmployeeScheduleForDayResolver;
use App\Models\Appointment;
use Carbon\Carbon;

/**
 * Huecos disponibles para un empleado en una fecha (misma regla que el flujo previo en Livewire).
 */
class GetAvailableSlotsQuery
{
    public function __construct(
        private readonly EmployeeScheduleForDayResolver $scheduleForDayResolver,
    ) {}

    public function execute(int $employeeId, string $date, int $serviceDurationMinutes): GetAvailableSlotsResult
    {
        $day = Carbon::parse($date)->startOfDay();
        $schedule = $this->scheduleForDayResolver->resolve($employeeId, $day);

        if (! $schedule) {
            return new GetAvailableSlotsResult(false, []);
        }

        if ($serviceDurationMinutes <= 0) {
            return new GetAvailableSlotsResult(true, []);
        }

        $appointments = Appointment::where('employee_id', $employeeId)
            ->whereDate('start_time', $day->toDateString())
            ->where('status_id', '!=', 1)
            ->orderBy('start_time')
            ->get();

        $fullDaySchedule = [
            'start' => Carbon::parse($schedule->start_time)->format('H:i'),
            'end' => Carbon::parse($schedule->end_time)->format('H:i'),
        ];

        $busyTimeSlots = $appointments->map(function ($appointment) {
            return [
                'start' => Carbon::parse($appointment->start_time)->format('H:i'),
                'end' => Carbon::parse($appointment->end_time)->format('H:i'),
            ];
        });

        $intervalDuration = 5;
        $employeeWorkingIntervals = [];

        $startTime = Carbon::parse($fullDaySchedule['start']);
        $endTime = Carbon::parse($fullDaySchedule['end']);

        while ($startTime->lte($endTime)) {
            $endInterval = $startTime->copy()->addMinutes($serviceDurationMinutes);

            $isIntervalAvailable = $busyTimeSlots->every(function ($busySlot) use ($startTime, $endInterval) {
                $busyStart = Carbon::parse($busySlot['start']);
                $busyEnd = Carbon::parse($busySlot['end']);

                return $startTime->gte($busyEnd) || $endInterval->lte($busyStart);
            });

            if ($isIntervalAvailable) {
                $employeeWorkingIntervals[] = [
                    'start' => $startTime->copy()->format('H:i'),
                    'end' => $endInterval->format('H:i'),
                ];
            }

            $startTime->addMinutes($intervalDuration);

            if ($endInterval->gte($endTime)) {
                break;
            }
        }

        return new GetAvailableSlotsResult(true, $employeeWorkingIntervals);
    }
}
