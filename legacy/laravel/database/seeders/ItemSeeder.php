<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Item;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [
            [
                'category_id' => 1, // Cortes
                'name' => 'Corte para caballeros',
                'slug' => 'corte-para-caballeros',
                'price' => 250,
                'description' => 'Cortes personalizados para hombres, desde estilos clásicos hasta tendencias modernas',
                'image' => 'hair-cut-man.webp',
            ],
            [
                'category_id' => 1,
                'name' => 'Corte para damas',
                'slug' => 'corte-para-damas',
                'price' => 300,
                'description' => 'Transforma tu look con cortes diseñados para resaltar tu belleza única',
                'image' => 'hair-cut-woman.webp',
            ],
            [
                'category_id' => 1,
                'name' => 'Corte para niños',
                'slug' => 'corte-para-niños',
                'price' => 200,
                'description' => 'Cortes para los más pequeños',
                'image' => 'hair-cut-boys.webp',
            ],
            [
                'category_id' => 1,
                'name' => 'Corte de barba',
                'slug' => 'corte-de-barba',
                'price' => 300,
                'description' => 'Para los hombres que desean un cuidado especial para su barba, ofrecemos cortes y arreglos de barba precisos',
                'image' => 'beard-trimming.webp',
            ],
            [
                'category_id' => 2, // Peinados
                'name' => 'Peinado especial',
                'slug' => 'peinado-especial',
                'price' => 450,
                'description' => '¿Tienes un evento especial? Permítenos crear un peinado que complemente tu atuendo y realce tu belleza',
                'image' => 'hair-treatment.webp',
            ],
            [
                'category_id' => 2,
                'name' => 'Laciado',
                'slug' => 'laciado',
                'price' => 450,
                'description' => 'Alisado profesional para un cabello suave y liso',
                'image' => 'hair-straightener.webp',
            ],
            [
                'category_id' => 3, // Color
                'name' => 'Tinta',
                'slug' => 'tinta',
                'price' => 400,
                'description' => 'Renueva tu color con opciones personalizadas',
                'image' => 'hair-dye.webp',
            ],
            [
                'category_id' => 3,
                'name' => 'Colores fantasía',
                'slug' => 'colores-fantasía',
                'price' => 600,
                'description' => 'Expresa tu creatividad con colores fantásticos. Desde tonos vibrantes hasta reflejos llamativos',
                'image' => 'hair-color-sample.webp',
            ],
            [
                'category_id' => 4, // Tratamientos
                'name' => 'Maquillaje',
                'slug' => 'maquillaje',
                'price' => 300,
                'description' => 'Realza tu belleza natural con nuestro servicio de maquillaje personalizado',
                'image' => 'make-up.webp',
            ],
            [
                'category_id' => 4,
                'name' => 'Baño de crema',
                'slug' => 'baño-de-crema',
                'price' => 800,
                'description' => 'Tratamientos revitalizantes para un cabello saludable',
                'image' => 'shampoo.webp',
            ],
            [
                'category_id' => 4,
                'name' => 'Extensiones',
                'slug' => 'extensiones',
                'price' => 750,
                'description' => 'Añade longitud y volumen con extensiones personalizadas que se integren a tu color',
                'image' => 'hair-extension.webp',
            ],
            [
                'category_id' => 4,
                'name' => 'Uñas',
                'slug' => 'uñas',
                'price' => 700,
                'description' => 'Manicuras y pedicuras para embellecer tus uñas',
                'image' => 'nail.webp',
            ],
        ];

        foreach ($items as $attrs) {
            $name = $attrs['name'];
            unset($attrs['name']);
            Item::firstOrCreate(
                ['name' => $name],
                $attrs
            );
        }
    }
}
