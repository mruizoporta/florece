<?php

namespace App\Domain\Orders\Exceptions;

class InvalidOrderStateException extends \DomainException
{
    public static function draftRequired(string $state): self
    {
        return new self("La orden debe estar en draft. Estado actual: {$state}.");
    }

    public static function cannotCancel(string $state): self
    {
        return new self("No se puede cancelar una orden en estado {$state}.");
    }
}

