<?php

namespace App\Application\Orders\DTOs;

final class CreateOrderData
{
    public function __construct(
        public readonly ?int $customerId,
        public readonly ?int $employeeId,
        public readonly string $name,
    ) {}
}

