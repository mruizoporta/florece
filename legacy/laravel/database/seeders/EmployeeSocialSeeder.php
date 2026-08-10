<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Employee;
use App\Models\EmployeeSocial;

class EmployeeSocialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $links = [
            'Juan' => [
                [1, 'instagram.com/@juan'],
                [2, 'linkedin.com/in/@juan'],
            ],
            'Eduard' => [
                [1, 'instagram.com/@eduard'],
                [2, 'linkedin.com/in/@eduard'],
            ],
            'Anna' => [
                [1, 'instagram.com/@anna'],
                [2, 'linkedin.com/in/@anna'],
            ],
            'Carl' => [
                [1, 'instagram.com/@carl'],
                [2, 'linkedin.com/in/@carl'],
            ],
        ];

        foreach ($links as $employeeName => $pairs) {
            $employee = Employee::query()->where('name', $employeeName)->first();
            if ($employee === null) {
                continue;
            }

            foreach ($pairs as [$socialId, $href]) {
                EmployeeSocial::firstOrCreate(
                    [
                        'employee_id' => $employee->id,
                        'social_id' => $socialId,
                    ],
                    ['href' => $href]
                );
            }
        }
    }
}
