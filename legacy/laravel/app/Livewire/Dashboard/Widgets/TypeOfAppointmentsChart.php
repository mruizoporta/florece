<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Application\Appointment\Queries\AppointmentDashboardMetricsQuery;
use Livewire\Component;

class TypeOfAppointmentsChart extends Component
{
    public function render()
    {
        $counts = app(AppointmentDashboardMetricsQuery::class)->countsByType();

        return view('livewire.dashboard.widgets.type-of-appointments-chart')->with([
            'flashAppointmentsCount' => $counts['flash'],
            'localAppointmentsCount' => $counts['local'],
            'webAppointmentsCount' => $counts['web'],
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.chart-card');
    }
}
