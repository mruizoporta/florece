<?php

namespace App\Livewire\Dashboard\Appointments;

use App\Application\Appointment\Queries\SearchAppointmentsQuery;
use App\Livewire\Traits\ImageTrait;
use App\Models\Appointment;
use Facades\App\Livewire\Actions\Dashboard\Appointment\CancelAction;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithPagination;

class ListAppointments extends Component
{
    use ImageTrait;
    use WithPagination;

    protected $paginationTheme = 'bootstrap';

    public $search;

    #[On('changed-search')]
    public function changedSearch($value)
    {
        $this->resetPage();
        $this->search = $value;
    }

    public function cancel($appointment)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('cancel', $model);

        CancelAction::handle($appointment);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Agenda cancelada',
        ]);
    }

    public function render()
    {
        $appointments = app(SearchAppointmentsQuery::class)->paginate(
            $this->search,
            5,
            'created_at',
            'desc',
            ['employee', 'services.item', 'status'],
        );

        return view('livewire.dashboard.appointments.list-appointments')->with([
            'appointments' => $appointments,
        ]);
    }
}
