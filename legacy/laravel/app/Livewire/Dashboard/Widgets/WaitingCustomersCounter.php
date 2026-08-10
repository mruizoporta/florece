<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Application\Appointment\Queries\AppointmentDashboardMetricsQuery;
use Livewire\Component;

class WaitingCustomersCounter extends Component
{
    public function render()
    {
        return view('livewire.dashboard.widgets.waiting-customers-counter')->with([
            'waitingCustomersCounter' => app(AppointmentDashboardMetricsQuery::class)->waitingTodayCount(),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.kpi-metric');
    }
}
