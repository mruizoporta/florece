<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Customer;
use App\Models\User;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userId = User::query()
            ->where('email', 'customer@blessingstar.com')
            ->value('id');

        if ($userId === null) {
            return;
        }

        Customer::firstOrCreate(['user_id' => $userId]);
    }
}
