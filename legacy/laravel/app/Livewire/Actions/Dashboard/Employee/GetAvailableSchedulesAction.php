<?php

namespace App\Livewire\Actions\Dashboard\Employee;

use App\Application\Appointment\Queries\GetAvailableSlotsQuery;
use Carbon\Carbon;

class GetAvailableSchedulesAction
{
    public function __construct(
        private readonly GetAvailableSlotsQuery $getAvailableSlotsQuery,
    ) {}

    /**
     * @param  mixed  $date  string o fecha parseable
     * @param  mixed  $schedule  ignorado; la query resuelve el horario del empleado (compatibilidad con llamadas existentes)
     */
    public function handle($employee_id, $date, $schedule, $serviceDurationInMinutes)
    {
        $dateStr = is_string($date) ? $date : Carbon::parse($date)->toDateString();

        return $this->getAvailableSlotsQuery->execute(
            (int) $employee_id,
            $dateStr,
            (int) $serviceDurationInMinutes
        )->slots;
    }
}
