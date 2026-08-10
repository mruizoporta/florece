<?php

namespace App\Livewire\Dashboard\Appointments;

use App\Application\Appointment\Commands\AddServiceToAppointmentCommand;
use App\Application\Appointment\Commands\ChangeAppointmentEmployeeCommand;
use App\Application\Appointment\Commands\RemoveServiceFromAppointmentCommand;
use App\Application\Appointment\Commands\RescheduleAppointmentCommand;
use App\Application\Appointment\DTOs\AddServiceToAppointmentData;
use App\Application\Appointment\DTOs\ChangeAppointmentEmployeeData;
use App\Application\Appointment\DTOs\RemoveServiceFromAppointmentData;
use App\Application\Appointment\DTOs\RescheduleAppointmentData;
use App\Application\Appointment\Queries\GetAppointmentServicesDurationQuery;
use App\Application\Appointment\Queries\IsEmployeeAttendingQuery;
use App\Application\Appointment\Queries\ListAppointmentsForDayQuery;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Livewire\Traits\ImageTrait;
use App\Models\Appointment;
use App\Models\Employee;
use App\Models\Service;
use Carbon\Carbon;
use Facades\App\Livewire\Actions\Dashboard\Appointment\AttendCustomerAction;
use Facades\App\Livewire\Actions\Dashboard\Appointment\CancelAction;
use Facades\App\Livewire\Actions\Dashboard\Appointment\ConfirmAssistanceAction;
use Livewire\Attributes\On;
use Livewire\Component;

class ListAppointmentsCards extends Component
{
    use ImageTrait;

    public ?int $rescheduleAppointmentId = null;

    public string $rescheduleEmployeeId = '';

    public string $rescheduleDate = '';

    public string $rescheduleTime = '';

    public function changeEmployee($appointment, $employee)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('update', $model);

        app(ChangeAppointmentEmployeeCommand::class)->handle(
            new ChangeAppointmentEmployeeData((int) $appointment, (int) $employee)
        );

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Se cambió el empleado',
        ]);
    }

    public function addService($appointment, $service)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('manageServices', $model);

        $result = app(AddServiceToAppointmentCommand::class)->handle(
            new AddServiceToAppointmentData((int) $appointment, (int) $service)
        );

        if ($result['created']) {
            $this->dispatch('notification-success', [
                'type' => 'success',
                'title' => 'Acción exitosa!',
                'body' => 'Se añadío *'.$result['service']->service->item->name.'*',
            ]);
        } else {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'Ya existe el servicio en la agenda',
            ]);
        }
    }

    public function deleteService($appointment, $service)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('manageServices', $model);

        app(RemoveServiceFromAppointmentCommand::class)->handle(
            new RemoveServiceFromAppointmentData((int) $appointment, (int) $service)
        );

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Atención!',
            'body' => 'Servicio removido de la agenda',
        ]);
    }

    public function attendCustomer($appointment, $employee, $employee_name)
    {
        /**
         * Checkear que el empleado no esté atendiendo a un cliente
         */
        $check = app(IsEmployeeAttendingQuery::class)->execute((int) $employee);

        if ($check) {
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => $employee_name.' no se encuentra disponible.',
            ]);
        }

        $model = Appointment::findOrFail($appointment);
        $this->authorize('update', $model);

        $duration = app(GetAppointmentServicesDurationQuery::class)->execute((int) $appointment);

        if ($duration == 0) {
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'Seleccione los servicios.',
            ]);
        }

        AttendCustomerAction::handle($appointment, $duration);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'El cliente se está atendiendo.',
        ]);

        $this->dispatch('refresh-employees');
    }

    public function cancelAppointment($appointment)
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

    public function confirmAssistance($appointment)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('update', $model);

        ConfirmAssistanceAction::handle($appointment);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Asistencia confirmada',
        ]);
    }

    public function openReschedule($appointmentId)
    {
        $appointment = Appointment::query()->findOrFail($appointmentId);
        $this->authorize('reschedule', $appointment);

        $this->rescheduleAppointmentId = (int) $appointmentId;
        $this->rescheduleEmployeeId = (string) ($appointment->employee_id ?? '');
        $this->rescheduleDate = $appointment->start_time
            ? Carbon::parse($appointment->start_time)->toDateString()
            : '';
        $this->rescheduleTime = $appointment->start_time
            ? Carbon::parse($appointment->start_time)->format('H:i')
            : '';
    }

    public function closeReschedule()
    {
        $this->rescheduleAppointmentId = null;
        $this->rescheduleEmployeeId = '';
        $this->rescheduleDate = '';
        $this->rescheduleTime = '';
    }

    public function submitReschedule()
    {
        $this->validate([
            'rescheduleEmployeeId' => 'required|exists:employees,id',
            'rescheduleDate' => 'required|date',
            'rescheduleTime' => 'required|date_format:H:i',
        ], [], [
            'rescheduleEmployeeId' => 'empleado',
            'rescheduleDate' => 'fecha',
            'rescheduleTime' => 'hora',
        ]);

        $appointment = Appointment::query()->findOrFail($this->rescheduleAppointmentId);
        $this->authorize('reschedule', $appointment);

        $duration = app(GetAppointmentServicesDurationQuery::class)->execute((int) $appointment->id);
        if ($duration < 1) {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => 'La cita no tiene servicios con duración válida.',
            ]);

            return;
        }

        $startTime = Carbon::parse($this->rescheduleDate.' '.$this->rescheduleTime);
        $endTime = $startTime->copy()->addMinutes($duration);

        try {
            app(RescheduleAppointmentCommand::class)->handle(
                new RescheduleAppointmentData(
                    appointmentId: $appointment->id,
                    employeeId: (int) $this->rescheduleEmployeeId,
                    startTime: $startTime,
                    endTime: $endTime,
                )
            );
        } catch (SlotNotAvailableException $e) {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => $e->getMessage(),
            ]);

            return;
        }

        $this->closeReschedule();

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Cita reprogramada',
        ]);
    }

    #[On('refresh-appointments')]
    public function render()
    {
        $result = app(ListAppointmentsForDayQuery::class)->execute(
            now()->toDateString(),
            [2, 3],
            null,
            'start_time',
            'asc',
            ['customer', 'employee', 'status', 'services.item', 'type'],
        );

        return view('livewire.dashboard.appointments.list-appointments-cards')->with([
            'appointments' => $result->appointments,
            'employees'    => Employee::get(),
            'services'     => Service::with('item')->get(),
        ]);
    }
}
