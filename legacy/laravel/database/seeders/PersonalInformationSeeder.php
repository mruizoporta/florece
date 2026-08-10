<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Employee;
use App\Models\PersonalInformation;

class PersonalInformationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            'Juan' => [
                'document' => '346687412',
                'location' => 'Centro, Montevideo',
                'address' => 'Street J. 1234',
                'phone' => '59812345678',
            ],
            'Eduard' => [
                'document' => '53022574',
                'location' => 'Centro, Montevideo',
                'address' => 'Street E. 1234',
                'phone' => '59811222333',
            ],
            'Anna' => [
                'document' => '44810021',
                'location' => 'Centro, Montevideo',
                'address' => 'Street Z. 1337',
                'phone' => '5980011222',
            ],
            'Carl' => [
                'document' => '53574123',
                'location' => 'Centro, Montevideo',
                'address' => 'Street C. 1234',
                'phone' => '59833444555',
            ],
        ];

        foreach ($rows as $employeeName => $data) {
            $employee = Employee::query()->where('name', $employeeName)->first();
            if ($employee === null) {
                continue;
            }

            PersonalInformation::firstOrCreate(
                ['employee_id' => $employee->id],
                $data
            );
        }
    }
}
