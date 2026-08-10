<?php

namespace App\Application\Orders\DTOs;

final class UpdateOrderItemQuantityData
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $itemOrderId,
        public readonly int $quantity,
    ) {}
}

