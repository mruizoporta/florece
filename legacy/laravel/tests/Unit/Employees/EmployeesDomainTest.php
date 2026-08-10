<?php

namespace Tests\Unit\Employees;

use App\Domain\Employees\Exceptions\InvalidScheduleIntervalException;
use App\Domain\Employees\Exceptions\ScheduleOverlapException;
use App\Domain\Employees\WeeklyScheduleValidator;
use PHPUnit\Framework\TestCase;

class EmployeesDomainTest extends TestCase
{
    public function test_schedule_requires_start_before_end(): void
    {
        $this->expectException(InvalidScheduleIntervalException::class);

        (new WeeklyScheduleValidator())->validate([
            1 => [
                ['start' => '10:00', 'end' => '10:00'],
            ],
        ]);
    }

    public function test_schedule_rejects_overlaps_per_day(): void
    {
        $this->expectException(ScheduleOverlapException::class);

        (new WeeklyScheduleValidator())->validate([
            2 => [
                ['start' => '09:00', 'end' => '12:00'],
                ['start' => '11:30', 'end' => '13:00'],
            ],
        ]);
    }

    public function test_schedule_allows_non_overlapping_ranges(): void
    {
        (new WeeklyScheduleValidator())->validate([
            3 => [
                ['start' => '09:00', 'end' => '12:00'],
                ['start' => '12:00', 'end' => '16:00'],
            ],
            4 => [],
        ]);

        $this->assertTrue(true);
    }
}

