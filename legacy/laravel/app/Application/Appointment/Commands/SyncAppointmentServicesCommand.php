<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\SyncAppointmentServicesData;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Service;
use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

class SyncAppointmentServicesCommand
{
    public function handle(SyncAppointmentServicesData $data): void
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }

        $serviceIds = array_values(array_unique(array_map('intval', $data->serviceIds)));
        if ($serviceIds === []) {
            throw new \InvalidArgumentException('Debe haber al menos un servicio.');
        }

        Appointment::query()->findOrFail($data->appointmentId);

        if (count($serviceIds) !== Service::query()->whereIn('id', $serviceIds)->count()) {
            throw new \InvalidArgumentException('Uno o más servicios no son válidos para este salón.');
        }

        DB::transaction(function () use ($data, $serviceIds) {
            AppointmentService::query()
                ->where('appointment_id', $data->appointmentId)
                ->whereNotIn('service_id', $serviceIds)
                ->delete();

            foreach ($serviceIds as $serviceId) {
                AppointmentService::firstOrCreate([
                    'appointment_id' => $data->appointmentId,
                    'service_id' => $serviceId,
                ]);
            }
        });
    }
}
