<?php

namespace App\Application\Appointment\Queries;

use App\Application\Appointment\Results\ListAppointmentsForDayResult;
use App\Models\Appointment;
use Carbon\Carbon;

class ListAppointmentsForDayQuery
{
    /**
     * Citas cuyo start_time cae en el día indicado (zona horaria de la app).
     *
     * @param  list<int>|null  $statusIds  null = sin filtro por estado
     * @param  list<string>  $with
     */
    public function execute(
        string $date,
        ?array $statusIds = null,
        ?int $employeeId = null,
        string $orderBy = 'start_time',
        string $orderDir = 'asc',
        array $with = ['customer', 'employee', 'status', 'services.item', 'type'],
    ): ListAppointmentsForDayResult {
        $dateString = Carbon::parse($date)->toDateString();

        $q = Appointment::query()
            ->with($with)
            ->whereDate('start_time', $dateString);

        if ($statusIds !== null) {
            $q->whereIn('status_id', $statusIds);
        }

        if ($employeeId !== null) {
            $q->where('employee_id', $employeeId);
        }

        $appointments = $q->orderBy($orderBy, $orderDir)->get();

        return new ListAppointmentsForDayResult($dateString, $appointments);
    }

    /**
     * Conteo por estado (misma semántica que consultas directas sobre appointments).
     *
     * @param  list<int>  $statusIds
     */
    public function countForDay(string $date, array $statusIds): int
    {
        $dateString = Carbon::parse($date)->toDateString();

        return Appointment::query()
            ->whereDate('start_time', $dateString)
            ->whereIn('status_id', $statusIds)
            ->count();
    }

    /**
     * Retorna conteos por status_id para el día indicado en una sola query.
     * La clave del resultado es el status_id, el valor es la cantidad.
     *
     * @return \Illuminate\Support\Collection<int, int>
     */
    public function countsByStatusForDay(string $date): \Illuminate\Support\Collection
    {
        $dateString = Carbon::parse($date)->toDateString();

        return Appointment::query()
            ->whereDate('start_time', $dateString)
            ->selectRaw('status_id, COUNT(*) as total')
            ->groupBy('status_id')
            ->pluck('total', 'status_id');
    }
}
