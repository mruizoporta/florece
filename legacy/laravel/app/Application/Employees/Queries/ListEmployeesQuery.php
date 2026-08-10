<?php

namespace App\Application\Employees\Queries;

use App\Models\Employee;
use Illuminate\Support\Collection;

class ListEmployeesQuery
{
    /**
     * @return Collection<int, \App\Models\Employee>
     */
    public function execute(?string $search = null, bool $includeArchived = false, int $limit = 50): Collection
    {
        $limit = max(1, $limit);
        $query = Employee::query()->with(['schedules', 'socials']);

        if (! $includeArchived) {
            $query->where('status', true);
        }

        if ($search) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        return $query->orderBy('created_at', 'desc')->limit($limit)->get();
    }
}

