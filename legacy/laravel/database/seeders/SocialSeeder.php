<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Social;

class SocialSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $socials = [
            ['name' => 'Instagram', 'icon' => 'instagram'],
            ['name' => 'Linkedin', 'icon' => 'linkedin-in'],
            ['name' => 'Facebook', 'icon' => 'facebook'],
            ['name' => 'TikTok', 'icon' => 'tiktok'],
            ['name' => 'Website', 'icon' => 'link'],
        ];

        foreach ($socials as $attrs) {
            Social::firstOrCreate(
                ['name' => $attrs['name']],
                ['icon' => $attrs['icon']]
            );
        }
    }
}
