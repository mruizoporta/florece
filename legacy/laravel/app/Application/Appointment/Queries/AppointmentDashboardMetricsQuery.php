<?php

namespace App\Application\Appointment\Queries;

use App\Models\Appointment;

class AppointmentDashboardMetricsQuery
{
    /**
     * @return array{flash: int, local: int, web: int}
     */
    public function countsByType(): array
    {
        $counts = Appointment::query()
            ->selectRaw('type_id, COUNT(*) as total')
            ->groupBy('type_id')
            ->pluck('total', 'type_id');

        return [
            'flash' => (int) ($counts->get(1) ?? 0),
            'local' => (int) ($counts->get(2) ?? 0),
            'web'   => (int) ($counts->get(3) ?? 0),
        ];
    }

    public function waitingCustomersCount(): int
    {
        return Appointment::query()->where('status_id', 3)->count();
    }

    public function waitingTodayCount(): int
    {
        return Appointment::query()
            ->where('status_id', 3)
            ->whereDate('start_time', now()->toDateString())
            ->count();
    }
}
