<?php

namespace App\Application\Appointment\Results;

/**
 * @phpstan-type Slot array{start: string, end: string}
 */
final class GetAvailableSlotsResult
{
    /**
     * @param  list<Slot>  $slots
     */
    public function __construct(
        public readonly bool $employeeWorksThatDay,
        public readonly array $slots,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        return [
            'employee_works_that_day' => $this->employeeWorksThatDay,
            'slots' => $this->slots,
        ];
    }
}
