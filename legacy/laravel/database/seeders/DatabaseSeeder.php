<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if ($tenant = Tenant::query()->first()) {
            Tenant::setCurrent($tenant);
        }

        $this->call([
            PlanSeeder::class,
            CategorySeeder::class,
            RoleSeeder::class,
            SocialSeeder::class,
            ItemSeeder::class,
            ServiceSeeder::class,
            SectionSeeder::class,
            SettingSeeder::class,
            StatusSeeder::class,
            TypeSeeder::class,

            UserSeeder::class,
            CustomerSeeder::class,

            EmployeeSeeder::class, // De prueba
            EmployeeSocialSeeder::class, // De prueba
            PersonalInformationSeeder::class, // De prueba
            ScheduleSeeder::class, // De prueba
            SponsorSeeder::class, // De prueba
        ]);
    }
}
