<?php

namespace App\Domain\Catalog\Service;

use App\Domain\Catalog\Exceptions\InvalidServiceDurationException;

final class Service
{
    public function __construct(
        public readonly int $durationTime,
    ) {
        if ($this->durationTime <= 0) {
            throw InvalidServiceDurationException::forNonPositiveDuration($this->durationTime);
        }
    }
}

