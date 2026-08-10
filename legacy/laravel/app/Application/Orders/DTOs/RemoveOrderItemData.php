<?php

namespace App\Application\Orders\DTOs;

final class RemoveOrderItemData
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $itemOrderId,
    ) {}
}

