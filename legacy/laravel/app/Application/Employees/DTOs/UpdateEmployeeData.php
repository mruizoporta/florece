<?php

namespace App\Application\Employees\DTOs;

final class UpdateEmployeeData
{
    public function __construct(
        public readonly int $employeeId,
        public readonly string $name,
        public readonly string $description,
        public readonly string $image,
        public readonly bool $status,
        public readonly bool $visiblePublic,
    ) {}
}

