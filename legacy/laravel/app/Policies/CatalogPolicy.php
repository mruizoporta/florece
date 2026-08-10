<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class CatalogPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function create(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function update(User $user, \Illuminate\Database\Eloquent\Model $model): bool
    {
        return $this->staffInTenant($user);
    }

    public function archive(User $user, \Illuminate\Database\Eloquent\Model $model): bool
    {
        return $this->staffInTenant($user);
    }

    public function delete(User $user, \Illuminate\Database\Eloquent\Model $model): bool
    {
        return $this->staffInTenant($user);
    }

    public function manageStock(User $user, \Illuminate\Database\Eloquent\Model $model): bool
    {
        return $this->staffInTenant($user);
    }

    public function view(User $user, Model $model): bool
    {
        return $this->staffInTenant($user);
    }

    protected function staffInTenant(User $user): bool
    {
        return (bool) $user->tenant_id && $user->hasRole('Admin');
    }
}

