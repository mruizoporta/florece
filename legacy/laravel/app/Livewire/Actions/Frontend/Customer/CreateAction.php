<?php

namespace App\Livewire\Actions\Frontend\Customer;

use App\Models\Customer;

class CreateAction
{
    public function handle($user_id)
    {
        return Customer::create([
            'user_id' => $user_id
        ]);
    }
}
