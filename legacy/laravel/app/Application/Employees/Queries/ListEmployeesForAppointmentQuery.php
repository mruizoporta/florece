<?php

namespace App\Application\Employees\Queries;

use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ListEmployeesForAppointmentQuery
{
    /**
     * @return Collection<int, \App\Models\Employee>
     */
    public function execute(?string $date = null): Collection
    {
        $query = Employee::query()->where('status', true);

        if ($date) {
            $day = Carbon::parse($date)->dayOfWeek;
            $weekday = $day === 0 ? 7 : $day;

            $query->whereHas('schedules', function ($scheduleQuery) use ($weekday) {
                $scheduleQuery
                    ->where('weekday', $weekday)
                    ->where('status', true);
            });
        }

        return $query->orderBy('name')->get();
    }
}

