<?php

namespace App\Application\Employees\Commands;

use App\Application\Employees\DTOs\ReplaceWeeklyScheduleData;
use App\Domain\Employees\WeeklyScheduleValidator;
use App\Models\Employee;
use App\Models\Schedule;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class ReplaceWeeklyScheduleCommand
{
    public function __construct(
        private readonly WeeklyScheduleValidator $validator,
    ) {}

    public function handle(ReplaceWeeklyScheduleData $data): void
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        $this->validator->validate($data->weekSlots);

        DB::transaction(function () use ($employee, $data) {
            Schedule::query()->where('employee_id', $employee->id)->delete();

            foreach ($data->weekSlots as $weekday => $slots) {
                foreach ($slots as $slot) {
                    Schedule::query()->create([
                        'employee_id' => $employee->id,
                        'weekday' => (int) $weekday,
                        'start_time' => $slot['start'],
                        'end_time' => $slot['end'],
                        'status' => true,
                    ]);
                }
            }
        });
    }
}

