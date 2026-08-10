<?php

namespace App\Application\Orders\DTOs;

final class CancelOrderData
{
    public function __construct(
        public readonly int $orderId,
        public readonly ?string $reason = null,
    ) {}
}

