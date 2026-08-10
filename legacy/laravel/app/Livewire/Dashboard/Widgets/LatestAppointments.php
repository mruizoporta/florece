<?php

namespace App\Livewire\Dashboard\Widgets;

use App\Application\Appointment\Queries\LatestAppointmentsQuery;
use App\Livewire\Traits\ImageTrait;
use Livewire\Component;

class LatestAppointments extends Component
{
    use ImageTrait;

    public function render()
    {
        return view('livewire.dashboard.widgets.latest-appointments')->with([
            'latestAppointments' => app(LatestAppointmentsQuery::class)->execute(8, [
                'customer', 'services', 'status', 'type',
            ]),
        ]);
    }

    public function placeholder()
    {
        return view('livewire.dashboard.widgets.skeletons.latest-appointments-table');
    }
}
