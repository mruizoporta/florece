<?php

namespace App\Application\Catalog\DTOs;

final class ArchiveServiceData
{
    public function __construct(
        public readonly int $serviceId,
        public readonly bool $active = false,
    ) {}
}

