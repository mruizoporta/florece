<?php

namespace App\Livewire\Actions\Dashboard\Schedule;

use App\Domain\Appointment\EmployeeScheduleForDayResolver;
use Carbon\Carbon;

class GetScheduleForDayAction
{
    public function __construct(
        private readonly EmployeeScheduleForDayResolver $scheduleForDayResolver,
    ) {}

    public function handle($employee_id, $day)
    {
        $carbon = $day instanceof Carbon ? $day : Carbon::parse($day);

        return $this->scheduleForDayResolver->resolve((int) $employee_id, $carbon);
    }
}
