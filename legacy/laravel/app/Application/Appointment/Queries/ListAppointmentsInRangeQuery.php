<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class ListAppointmentsInRangeQuery
{
    /**
     * Citas que intersectan el rango [start, end] (inicio o fin dentro del rango).
     *
     * @param  list<string>  $with
     * @return Collection<int, Appointment>
     */
    public function execute(Carbon $start, Carbon $end, array $with = ['employee', 'services.item', 'type', 'status']): Collection
    {
        return Appointment::query()
            ->with($with)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_time', [$start, $end])
                    ->orWhereBetween('end_time', [$start, $end]);
            })
            ->get();
    }
}
