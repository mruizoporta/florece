<?php

namespace App\Domain\Orders\Exceptions;

class InsufficientStockException extends \DomainException
{
    public static function forProduct(int $productId, int $requested, int $available): self
    {
        return new self("Stock insuficiente para producto #{$productId}. Solicitado: {$requested}, disponible: {$available}.");
    }
}

