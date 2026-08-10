<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Application\Appointment\Queries\ListAppointmentsForDayQuery;
use Livewire\Component;

class AppointmentsForToday extends Component
{
    public function render()
    {
        $counts = app(ListAppointmentsForDayQuery::class)->countsByStatusForDay(now()->toDateString());

        return view('livewire.dashboard.widgets.appointments-for-today')->with([
            'finishedAppointmentsCount' => (int) ($counts->get(5) ?? 0),
            'pendingAppointmentsCount'  => (int) $counts->only([2, 3, 4, 5])->sum(),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.kpi-metric', [
            'variant' => 'fraction',
        ]);
    }
}
