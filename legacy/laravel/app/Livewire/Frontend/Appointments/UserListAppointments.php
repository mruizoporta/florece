<?php

namespace App\Livewire\Frontend\Appointments;

use App\Application\Appointment\Queries\ListCustomerAppointmentsQuery;
use App\Livewire\Traits\ImageTrait;
use App\Models\Appointment;
use Facades\App\Livewire\Actions\Frontend\Appointment\CancelAction;
use Livewire\Component;
use Livewire\WithPagination;

class UserListAppointments extends Component
{
    use ImageTrait;
    use WithPagination;

    protected $paginationTheme = 'bootstrap';

    public $customerId;

    public function cancelAppointment($appointment)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('cancel', $model);

        CancelAction::handle($appointment);

        return $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Tu agenda ha sido cancelada. Puedes agendarte nuevamente.',
        ]);
    }

    public function render()
    {
        return view('livewire.frontend.appointments.user-list-appointments')->with([
            'appointments' => app(ListCustomerAppointmentsQuery::class)->paginateForCustomer(
                (int) $this->customerId,
                5,
                ['employee', 'services', 'status'],
            ),
        ]);
    }
}
