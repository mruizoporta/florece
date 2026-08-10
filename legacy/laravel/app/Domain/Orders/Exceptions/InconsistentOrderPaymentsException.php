<?php

namespace App\Domain\Orders\Exceptions;

class InconsistentOrderPaymentsException extends \DomainException
{
    public static function forTotals(float $payments, float $orderTotal): self
    {
        return new self("Pagos inconsistentes. Pagos={$payments}, total orden={$orderTotal}.");
    }
}

