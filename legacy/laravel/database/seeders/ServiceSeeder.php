<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            [1, 40],
            [2, 40],
            [3, 25],
            [4, 15],
            [5, 40],
            [6, 25],
            [7, 40],
            [8, 60],
            [9, 25],
            [10, 30],
            [11, 30],
            [12, 50],
        ];

        foreach ($rows as [$itemId, $duration]) {
            Service::firstOrCreate(
                ['item_id' => $itemId],
                ['duration_time' => $duration]
            );
        }
    }
}
