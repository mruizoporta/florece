<?php

namespace App\Livewire\Actions\Dashboard\User;

use App\Models\User;

class AssignRoleAdminAction
{
    public function handle($id)
    {
        $user = User::query()
            ->where('tenant_id', \App\Models\Tenant::current()->id)
            ->findOrFail($id);

        return $user->assignRole(['Admin']);
    }
}
