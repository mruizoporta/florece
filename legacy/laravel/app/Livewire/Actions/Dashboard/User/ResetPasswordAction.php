<?php

namespace App\Livewire\Actions\Dashboard\User;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ResetPasswordAction
{
    public function handle($id)
    {
        return User::query()
            ->where('tenant_id', Auth::user()->tenant_id)
            ->findOrFail($id)
            ->update([
            'password' => bcrypt('1234')
        ]);
    }
}
