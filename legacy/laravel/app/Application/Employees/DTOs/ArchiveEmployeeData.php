<?php

namespace App\Application\Employees\DTOs;

final class ArchiveEmployeeData
{
    public function __construct(
        public readonly int $employeeId,
    ) {}
}

