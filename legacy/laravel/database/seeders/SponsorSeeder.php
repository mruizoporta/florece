<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Sponsor;

class SponsorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sponsors = [
            ['name' => 'Sponsor uno', 'image' => 'sponsor-1.png'],
            ['name' => 'Sponsor dos', 'image' => 'sponsor-2.png'],
            ['name' => 'Sponsor tres', 'image' => 'sponsor-3.png'],
            ['name' => 'Sponsor cuatro', 'image' => 'sponsor-4.png'],
            ['name' => 'Sponsor cinco', 'image' => 'sponsor-5.png'],
            ['name' => 'Sponsor seis', 'image' => 'sponsor-6.png'],
            ['name' => 'Sponsor siete', 'image' => 'sponsor-7.png'],
            ['name' => 'Sponsor ocho', 'image' => 'sponsor-8.png'],
        ];

        foreach ($sponsors as $attrs) {
            Sponsor::firstOrCreate(
                ['name' => $attrs['name']],
                ['image' => $attrs['image']]
            );
        }
    }
}
