<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Employee;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $employees = [
            ['name' => 'Juan', 'description' => 'Barbero', 'image' => 'juan-avatar.jpg'],
            ['name' => 'Eduard', 'description' => 'Barbero', 'image' => 'eduard-avatar.jpg'],
            ['name' => 'Anna', 'description' => 'Peinados & Cortes & Uñas', 'image' => 'anna-avatar.jpg'],
            ['name' => 'Carl', 'description' => 'Barbero', 'image' => 'carl-avatar.jpg'],
        ];

        foreach ($employees as $attrs) {
            Employee::firstOrCreate(
                ['name' => $attrs['name']],
                [
                    'description' => $attrs['description'],
                    'image' => $attrs['image'],
                ]
            );
        }
    }
}
