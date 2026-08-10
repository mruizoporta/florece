<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Section;

class SectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (Section::query()->exists()) {
            return;
        }

        Section::create([]);
    }
}
