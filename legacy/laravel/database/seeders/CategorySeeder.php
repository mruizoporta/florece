<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Cortes', 'slug' => 'cortes'],
            ['name' => 'Peinados', 'slug' => 'peinados'],
            ['name' => 'Color', 'slug' => 'color'],
            ['name' => 'Tratamientos', 'slug' => 'tratamientos'],
        ];

        foreach ($categories as $attrs) {
            Category::firstOrCreate(
                ['name' => $attrs['name']],
                ['slug' => $attrs['slug']]
            );
        }
    }
}
