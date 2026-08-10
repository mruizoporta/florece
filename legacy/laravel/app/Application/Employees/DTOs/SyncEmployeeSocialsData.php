<?php

namespace App\Application\Employees\DTOs;

final class SyncEmployeeSocialsData
{
    /**
     * @param  array<int, array{social_id:int,href:string}>  $socials
     */
    public function __construct(
        public readonly int $employeeId,
        public readonly array $socials,
    ) {}
}

