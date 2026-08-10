<?php

namespace App\Application\Employees\DTOs;

final class ReplaceWeeklyScheduleData
{
    /**
     * @param  array<int, array<int, array{start:string,end:string}>>  $weekSlots
     */
    public function __construct(
        public readonly int $employeeId,
        public readonly array $weekSlots,
    ) {}
}

