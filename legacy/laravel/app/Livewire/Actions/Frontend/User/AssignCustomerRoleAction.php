<?php

namespace App\Livewire\Actions\Frontend\User;

use App\Models\User;

class AssignCustomerRoleAction
{
    public function handle($user_id)
    {
        $user = User::findOrFail($user_id);

        return $user->assignRole(['Customer']);
    }
}
