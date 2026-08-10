<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Type;

class TypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rows = [
            [
                'name' => 'Flash',
                'description' => 'Son las que se ingresan desde el tablero cuando un cliente asiste sin una agenda previa',
                'bg_color' => 'primary',
            ],
            [
                'name' => 'Local',
                'description' => 'Se ingresan desde el panel administrativo con el propósito de reservar el horario de consulta a los clientes',
                'bg_color' => 'info',
            ],
            [
                'name' => 'Web',
                'description' => 'Son los clientes mismos quienes se agendan por su cuenta a través de la web',
                'bg_color' => 'danger',
            ],
        ];

        foreach ($rows as $attrs) {
            Type::firstOrCreate(
                ['name' => $attrs['name']],
                [
                    'description' => $attrs['description'],
                    'bg_color' => $attrs['bg_color'],
                ]
            );
        }
    }
}
