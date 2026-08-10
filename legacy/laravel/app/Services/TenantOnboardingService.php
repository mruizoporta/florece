<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Section;
use App\Models\Setting;
use App\Models\Social;
use App\Models\Status;
use App\Models\Tenant;
use App\Models\Type;
use Illuminate\Database\Eloquent\Model;

class TenantOnboardingService
{
    /**
     * Datos mínimos para que un salón nuevo pueda operar (mismos catálogos que los seeders globales).
     */
    public function bootstrap(Tenant $tenant): void
    {
        Model::unguarded(function () use ($tenant) {
            Tenant::setCurrent($tenant);

            foreach ($this->statusRows() as $row) {
                Status::query()->create($row);
            }

            foreach ($this->typeRows() as $row) {
                Type::query()->create($row);
            }

            foreach ($this->categoryRows() as $row) {
                Category::query()->create($row);
            }

            foreach ($this->socialRows() as $row) {
                Social::query()->create($row);
            }

            Section::query()->create([
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Setting::query()->create([
                'company_name' => $tenant->name,
            ]);
        });
    }

    private function statusRows(): array
    {
        return [
            ['name' => 'Cancelado', 'description' => 'Agenda cancelada', 'bg_color' => 'danger'],
            ['name' => 'Pendiente', 'description' => 'Pendiente de llegada', 'bg_color' => 'warning'],
            ['name' => 'En espera', 'description' => 'En sala de espera', 'bg_color' => 'success'],
            ['name' => 'Atendiendo', 'description' => 'En atención', 'bg_color' => 'info'],
            ['name' => 'Concluido', 'description' => 'Agenda concluida', 'bg_color' => 'primary'],
        ];
    }

    private function typeRows(): array
    {
        return [
            ['name' => 'Flash', 'description' => 'Ingresadas desde el tablero sin agenda previa', 'bg_color' => 'primary'],
            ['name' => 'Local', 'description' => 'Reservadas desde el panel administrativo', 'bg_color' => 'info'],
            ['name' => 'Web', 'description' => 'Agendadas por el cliente en la web', 'bg_color' => 'danger'],
        ];
    }

    private function categoryRows(): array
    {
        $now = now();

        return [
            ['name' => 'Cortes', 'slug' => 'cortes', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Peinados', 'slug' => 'peinados', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Color', 'slug' => 'color', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Tratamientos', 'slug' => 'tratamientos', 'created_at' => $now, 'updated_at' => $now],
        ];
    }

    private function socialRows(): array
    {
        $now = now();

        return [
            ['name' => 'Instagram', 'icon' => 'instagram', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Linkedin', 'icon' => 'linkedin-in', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Facebook', 'icon' => 'facebook', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'TikTok', 'icon' => 'tiktok', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Website', 'icon' => 'link', 'created_at' => $now, 'updated_at' => $now],
        ];
    }
}
