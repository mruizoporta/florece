<?php

namespace App\Application\Orders\DTOs;

final class FinalizeOrderData
{
    public function __construct(
        public readonly int $orderId,
    ) {}
}

