<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = Tenant::query()->first()?->id ?? (int) env('SEED_TENANT_ID', 1);

        $users = [
            [
                'name' => 'Consumidor final',
                'email' => 'consumidorfinal@example.com',
                'password' => bcrypt(Str::random(16)),
                'role' => 'Final consumer',
            ],
            [
                'name' => 'Administrador',
                'email' => 'admin@blessingstar.com',
                'password' => bcrypt('1234'),
                'role' => 'Admin',
            ],
            [
                'name' => 'Milagros',
                'email' => 'customer@blessingstar.com',
                'password' => bcrypt('1234'),
                'role' => 'Customer',
            ],
        ];

        foreach ($users as $row) {
            $role = $row['role'];
            unset($row['role']);

            $user = User::firstOrCreate(
                ['email' => $row['email'], 'tenant_id' => $tenantId],
                [
                    'name' => $row['name'],
                    'password' => $row['password'],
                ]
            );

            if (! $user->hasRole($role)) {
                $user->assignRole($role);
            }
        }
    }
}
