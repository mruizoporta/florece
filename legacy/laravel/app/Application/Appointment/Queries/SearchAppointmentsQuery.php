<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SearchAppointmentsQuery
{
    /**
     * @param  list<string>  $with
     */
    public function paginate(
        ?string $search,
        int $perPage = 5,
        string $orderBy = 'created_at',
        string $orderDir = 'desc',
        array $with = ['employee', 'services.item', 'status'],
    ): LengthAwarePaginator {
        $q = Appointment::query()->with($with);

        if ($search !== null && $search !== '') {
            $term = '%'.$search.'%';
            $q->where(function ($query) use ($term) {
                $query->where('name', 'like', $term)
                    ->orWhere('start_time', 'like', $term);
            });
        }

        return $q->orderBy($orderBy, $orderDir)->paginate($perPage);
    }
}
