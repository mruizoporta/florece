<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Employee;
use App\Models\Schedule;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $names123 = ['Juan', 'Eduard', 'Anna'];
        foreach ($names123 as $name) {
            $employee = Employee::query()->where('name', $name)->first();
            if ($employee === null) {
                continue;
            }
            $this->seedScheduleGroupA($employee->id);
        }

        $carl = Employee::query()->where('name', 'Carl')->first();
        if ($carl !== null) {
            $this->seedScheduleGroupB($carl->id);
        }
    }

    private function seedScheduleGroupA(int $employeeId): void
    {
        foreach (range(1, 5) as $weekday) {
            $this->upsertSchedule($employeeId, $weekday, '09:00:00', '16:00:00', true);
        }
        $this->upsertSchedule($employeeId, 6, '09:00:00', '13:00:00', true);
        $this->upsertSchedule($employeeId, 7, '09:00:00', '13:00:00', false);
    }

    private function seedScheduleGroupB(int $employeeId): void
    {
        foreach (range(1, 5) as $weekday) {
            $this->upsertSchedule($employeeId, $weekday, '09:00:00', '16:00:00', true);
        }
        $this->upsertSchedule($employeeId, 6, '09:00:00', '13:00:00', false);
        $this->upsertSchedule($employeeId, 7, '09:00:00', '13:00:00', false);
    }

    private function upsertSchedule(int $employeeId, int $weekday, string $start, string $end, bool $status): void
    {
        Schedule::firstOrCreate(
            [
                'employee_id' => $employeeId,
                'weekday' => $weekday,
            ],
            [
                'start_time' => $start,
                'end_time' => $end,
                'status' => $status,
            ]
        );
    }
}
