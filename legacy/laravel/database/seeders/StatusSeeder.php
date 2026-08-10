<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Status;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            ['name' => 'Cancelado', 'description' => 'Agenda cancelada', 'bg_color' => 'danger'],
            ['name' => 'Pendiente', 'description' => 'Pendiente de llegada', 'bg_color' => 'warning'],
            ['name' => 'En espera', 'description' => 'En sala de espera', 'bg_color' => 'success'],
            ['name' => 'Atendiendo', 'description' => 'En atención', 'bg_color' => 'info'],
            ['name' => 'Concluido', 'description' => 'Agenda concluida', 'bg_color' => 'primary'],
        ];

        foreach ($rows as $attrs) {
            Status::firstOrCreate(
                ['name' => $attrs['name']],
                [
                    'description' => $attrs['description'],
                    'bg_color' => $attrs['bg_color'],
                ]
            );
        }
    }
}
