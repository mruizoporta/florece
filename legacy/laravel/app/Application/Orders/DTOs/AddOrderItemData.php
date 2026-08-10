<?php

namespace App\Application\Orders\DTOs;

final class AddOrderItemData
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $productId,
        public readonly int $quantity,
    ) {}
}

