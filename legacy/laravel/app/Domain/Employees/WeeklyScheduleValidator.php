<?php

namespace App\Domain\Employees;

use App\Domain\Employees\Exceptions\InvalidScheduleIntervalException;
use App\Domain\Employees\Exceptions\ScheduleOverlapException;

class WeeklyScheduleValidator
{
    /**
     * @param  array<int, array<int, array{start:string,end:string}>>  $weekSlots
     */
    public function validate(array $weekSlots): void
    {
        foreach ($weekSlots as $weekday => $slots) {
            if ($weekday < 1 || $weekday > 7) {
                throw new \InvalidArgumentException('El weekday debe estar entre 1 y 7.');
            }

            $normalized = [];
            foreach ($slots as $slot) {
                $start = (string) ($slot['start'] ?? '');
                $end = (string) ($slot['end'] ?? '');

                if ($start === '' || $end === '') {
                    throw new \InvalidArgumentException('Cada franja requiere start y end.');
                }

                if (strtotime($start) === false || strtotime($end) === false) {
                    throw new \InvalidArgumentException('Formato de hora inválido. Use HH:MM o HH:MM:SS.');
                }

                if ($start >= $end) {
                    throw InvalidScheduleIntervalException::forRange($start, $end);
                }

                $normalized[] = ['start' => $start, 'end' => $end];
            }

            usort($normalized, fn (array $a, array $b) => strcmp($a['start'], $b['start']));

            for ($i = 1; $i < count($normalized); $i++) {
                $prev = $normalized[$i - 1];
                $current = $normalized[$i];

                if ($current['start'] < $prev['end']) {
                    throw ScheduleOverlapException::forWeekday($weekday);
                }
            }
        }
    }
}

