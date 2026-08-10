<?php

namespace App\Application\Appointment\DTOs;

use App\Models\Appointment;
use Carbon\Carbon;

/**
 * Vista plana de una cita para API / serialización.
 */
final class AppointmentDayItemData
{
    /**
     * @param  list<array{id: int, name: string}>  $services
     */
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly ?string $phone,
        public readonly string $startTime,
        public readonly ?string $endTime,
        public readonly int $statusId,
        public readonly ?string $statusName,
        public readonly ?int $employeeId,
        public readonly ?string $employeeName,
        public readonly ?int $typeId,
        public readonly ?string $typeName,
        public readonly array $services,
    ) {}

    public static function fromModel(Appointment $a): self
    {
        $services = $a->relationLoaded('services')
            ? $a->services->map(function ($s) {
                $name = $s->relationLoaded('item') && $s->item
                    ? $s->item->name
                    : (string) $s->id;

                return ['id' => (int) $s->id, 'name' => $name];
            })->values()->all()
            : [];

        return new self(
            id: (int) $a->id,
            name: $a->name,
            phone: $a->phone ?? null,
            startTime: $a->start_time ? Carbon::parse($a->start_time)->toIso8601String() : '',
            endTime: $a->end_time ? Carbon::parse($a->end_time)->toIso8601String() : null,
            statusId: (int) $a->status_id,
            statusName: $a->relationLoaded('status') && $a->status ? $a->status->name : null,
            employeeId: $a->employee_id !== null ? (int) $a->employee_id : null,
            employeeName: $a->relationLoaded('employee') && $a->employee ? $a->employee->name : null,
            typeId: $a->type_id !== null ? (int) $a->type_id : null,
            typeName: $a->relationLoaded('type') && $a->type ? $a->type->name : null,
            services: $services,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'status_id' => $this->statusId,
            'status_name' => $this->statusName,
            'employee_id' => $this->employeeId,
            'employee_name' => $this->employeeName,
            'type_id' => $this->typeId,
            'type_name' => $this->typeName,
            'services' => $this->services,
        ];
    }
}
