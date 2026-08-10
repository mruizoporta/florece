<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;
use Illuminate\Database\Eloquent\Collection;

class LatestAppointmentsQuery
{
    /**
     * @param  list<string>  $with
     * @return Collection<int, Appointment>
     */
    public function execute(int $limit = 8, array $with = ['customer', 'services', 'status', 'type']): Collection
    {
        return Appointment::query()
            ->with($with)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }
}
