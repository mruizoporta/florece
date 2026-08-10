<?php

namespace App\Application\Appointment\Commands;

use App\Application\Appointment\DTOs\AddServiceToAppointmentData;
use App\Models\Appointment;
use App\Models\AppointmentService;
use App\Models\Service;
use App\Models\Tenant;

class AddServiceToAppointmentCommand
{
    /**
     * @return array{service: AppointmentService, created: bool}
     */
    public function handle(AddServiceToAppointmentData $data): array
    {
        $this->assertTenant();

        Appointment::query()->findOrFail($data->appointmentId);
        Service::query()->findOrFail($data->serviceId);

        $existing = AppointmentService::query()
            ->where('appointment_id', $data->appointmentId)
            ->where('service_id', $data->serviceId)
            ->with('service.item')
            ->first();

        if ($existing) {
            return ['service' => $existing, 'created' => false];
        }

        $row = AppointmentService::create([
            'appointment_id' => $data->appointmentId,
            'service_id' => $data->serviceId,
        ]);

        $row->load('service.item');

        return ['service' => $row, 'created' => true];
    }

    private function assertTenant(): void
    {
        if (! Tenant::current()?->id) {
            throw new \RuntimeException('No hay contexto de tenant.');
        }
    }
}
