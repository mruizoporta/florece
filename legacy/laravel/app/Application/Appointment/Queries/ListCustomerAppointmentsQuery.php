<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ListCustomerAppointmentsQuery
{
    /**
     * @param  list<string>  $with
     */
    public function paginateForCustomer(
        int $customerId,
        int $perPage = 5,
        array $with = ['employee', 'services', 'status'],
    ): LengthAwarePaginator {
        return Appointment::query()
            ->with($with)
            ->where('customer_id', $customerId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }
}
