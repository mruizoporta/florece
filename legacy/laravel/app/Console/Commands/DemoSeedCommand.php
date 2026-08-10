<?php

namespace App\Console\Commands;

use App\Services\DemoTenantService;
use Illuminate\Console\Command;

class DemoSeedCommand extends Command
{
    protected $signature = 'demo:seed
                            {--reset : Borrar datos existentes y recrear}';

    protected $description = 'Crear o actualizar el tenant demo con datos de ejemplo';

    public function handle(): int
    {
        $this->info('Creando tenant demo...');

        $tenant = app(DemoTenantService::class)->seed(reset: $this->option('reset'));

        $this->info("Tenant demo listo: {$tenant->name} ({$tenant->slug})");
        $this->line('URL: ' . DemoTenantService::demoUrl());
        $this->line('Panel admin: ' . DemoTenantService::DEMO_ADMIN_EMAIL . ' / ' . DemoTenantService::DEMO_ADMIN_PASSWORD);

        return Command::SUCCESS;
    }
}
