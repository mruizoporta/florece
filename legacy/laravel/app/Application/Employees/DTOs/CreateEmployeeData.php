<?php

namespace App\Application\Employees\DTOs;

final class CreateEmployeeData
{
    public function __construct(
        public readonly string $name,
        public readonly string $description,
        public readonly string $image,
        public readonly bool $status,
        public readonly bool $visiblePublic,
    ) {}
}

