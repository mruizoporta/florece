<?php

namespace App\Application\Employees\Queries;

use App\Models\Employee;

class GetWeeklyScheduleQuery
{
    /**
     * @return array<int, array<int, array{start:string,end:string}>>
     */
    public function execute(int $employeeId): array
    {
        $employee = Employee::query()->findOrFail($employeeId);

        $week = [
            1 => [],
            2 => [],
            3 => [],
            4 => [],
            5 => [],
            6 => [],
            7 => [],
        ];

        $employee->schedules()
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->get()
            ->each(function ($schedule) use (&$week) {
                $week[(int) $schedule->weekday][] = [
                    'start' => substr((string) $schedule->start_time, 0, 5),
                    'end' => substr((string) $schedule->end_time, 0, 5),
                ];
            });

        return $week;
    }
}

