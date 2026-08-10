<?php

namespace App\Application\Catalog\DTOs;

final class UpdateServiceData
{
    public function __construct(
        public readonly int $serviceId,
        public readonly int $categoryId,
        public readonly string $name,
        public readonly string $slug,
        public readonly float $price,
        public readonly string $description,
        public readonly ?string $image,
        public readonly bool $status,
        public readonly int $durationTime,
    ) {}
}

