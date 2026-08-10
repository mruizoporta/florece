<?php

namespace App\Application\Employees\Commands;

use App\Application\Employees\DTOs\SyncEmployeeSocialsData;
use App\Models\Employee;
use App\Models\EmployeeSocial;
use App\Models\Social;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class SyncEmployeeSocialsCommand
{
    public function handle(SyncEmployeeSocialsData $data): void
    {
        $tenant = Tenant::current();
        if (! $tenant || $tenant->id === null) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $employee = Employee::query()->findOrFail($data->employeeId);
        $socialIds = array_values(array_unique(array_map(
            fn (array $social) => (int) $social['social_id'],
            $data->socials
        )));

        if (count($socialIds) !== Social::query()->whereIn('id', $socialIds)->count()) {
            throw new \InvalidArgumentException('Una o más redes sociales son inválidas para este salón.');
        }

        DB::transaction(function () use ($employee, $data, $tenant) {
            EmployeeSocial::query()->where('employee_id', $employee->id)->delete();

            foreach ($data->socials as $social) {
                EmployeeSocial::query()->create([
                    'employee_id' => $employee->id,
                    'social_id' => (int) $social['social_id'],
                    'href' => (string) $social['href'],
                    'tenant_id' => $tenant->id,
                ]);
            }
        });
    }
}

