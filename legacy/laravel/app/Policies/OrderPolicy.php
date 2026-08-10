<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function view(User $user, Order $order): bool
    {
        return $this->staffInTenant($user);
    }

    public function create(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function update(User $user, Order $order): bool
    {
        return $this->staffInTenant($user) && $order->status === 'draft';
    }

    public function finalize(User $user, Order $order): bool
    {
        return $this->staffInTenant($user) && $order->status === 'draft';
    }

    public function cancel(User $user, Order $order): bool
    {
        return $this->staffInTenant($user) && in_array($order->status, ['draft', 'finalized'], true);
    }

    public function managePayments(User $user, Order $order): bool
    {
        return $this->staffInTenant($user) && $order->status === 'draft';
    }

    public function viewReports(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    private function staffInTenant(User $user): bool
    {
        return (bool) $user->tenant_id && $user->hasRole('Admin');
    }
}

