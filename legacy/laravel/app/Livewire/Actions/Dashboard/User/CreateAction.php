<?php

namespace App\Livewire\Actions\Dashboard\User;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateAction
{
    public function handle($name, $email, $password)
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'tenant_id' => \App\Models\Tenant::current()->id,
        ]);
    }
}
