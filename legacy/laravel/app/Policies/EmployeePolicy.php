<?php

namespace App\Policies;

use App\Models\Employee;
use App\Models\User;

class EmployeePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function view(User $user, Employee $employee): bool
    {
        return $this->staffInTenant($user);
    }

    public function create(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function update(User $user, Employee $employee): bool
    {
        return $this->staffInTenant($user);
    }

    public function archive(User $user, Employee $employee): bool
    {
        return $this->staffInTenant($user);
    }

    public function manageSchedule(User $user, Employee $employee): bool
    {
        return $this->staffInTenant($user);
    }

    public function manageSocials(User $user, Employee $employee): bool
    {
        return $this->staffInTenant($user);
    }

    private function staffInTenant(User $user): bool
    {
        return (bool) $user->tenant_id && $user->hasRole('Admin');
    }
}

