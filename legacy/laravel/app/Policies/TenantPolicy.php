<?php

namespace App\Policies;

use App\Models\Tenant;
use App\Models\User;

class TenantPolicy
{
    public function manageBilling(User $user, Tenant $tenant): bool
    {
        return $user->tenant_id === $tenant->id
            && $user->hasRole('Admin');
    }

    public function subscribe(User $user, Tenant $tenant): bool
    {
        return $this->manageBilling($user, $tenant);
    }

    public function changePlan(User $user, Tenant $tenant): bool
    {
        return $this->manageBilling($user, $tenant);
    }

    public function viewBilling(User $user, Tenant $tenant): bool
    {
        return $this->manageBilling($user, $tenant);
    }
}
