<?php

namespace App\Application\Appointment\Results;

use App\Application\Appointment\DTOs\AppointmentDayItemData;
use App\Models\Appointment;
use Illuminate\Support\Collection;

final class ListAppointmentsForDayResult
{
    /**
     * @param  Collection<int, Appointment>  $appointments
     */
    public function __construct(
        public readonly string $date,
        public readonly Collection $appointments,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function items(): array
    {
        return $this->appointments
            ->map(fn (Appointment $a) => AppointmentDayItemData::fromModel($a)->toArray())
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        return [
            'date' => $this->date,
            'appointments' => $this->items(),
        ];
    }
}
