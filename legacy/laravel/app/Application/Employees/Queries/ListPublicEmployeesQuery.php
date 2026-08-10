<?php

namespace App\Application\Employees\Queries;

use App\Models\Employee;
use Illuminate\Support\Collection;

class ListPublicEmployeesQuery
{
    /**
     * @return Collection<int, \App\Models\Employee>
     */
    public function execute(): Collection
    {
        return Employee::query()
            ->with(['socials'])
            ->where('status', true)
            ->where('visible_public', true)
            ->orderBy('name')
            ->get();
    }
}

