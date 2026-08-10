<?php

namespace App\Console\Commands;

use App\Services\DemoTenantService;
use Illuminate\Console\Command;

class DemoResetCommand extends Command
{
    protected $signature = 'demo:reset';

    protected $description = 'Resetear el tenant demo (borrar datos y recrear)';

    public function handle(): int
    {
        $this->info('Reseteando tenant demo...');

        $tenant = app(DemoTenantService::class)->seed(reset: true);

        $this->info("Tenant demo reseteado: {$tenant->name}");
        $this->line('URL: ' . DemoTenantService::demoUrl());

        return Command::SUCCESS;
    }
}
