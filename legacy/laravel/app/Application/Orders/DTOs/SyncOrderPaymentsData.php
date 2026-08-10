<?php

namespace App\Application\Orders\DTOs;

final class SyncOrderPaymentsData
{
    /**
     * @param  array<int, array{method:string,amount:float,reference?:?string,paid_at?:?string}>  $payments
     */
    public function __construct(
        public readonly int $orderId,
        public readonly array $payments,
    ) {}
}

