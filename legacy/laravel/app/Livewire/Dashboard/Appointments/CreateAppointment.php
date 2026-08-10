<?php

namespace App\Livewire\Dashboard\Appointments;

use App\Application\Appointment\Queries\GetAvailableSlotsQuery;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Livewire\Forms\Dashboard\Appointment\CreateForm;
use App\Livewire\Traits\ImageTrait;
use App\Models\Employee;
use App\Models\Service;
use Carbon\Carbon;
use Livewire\Component;

class CreateAppointment extends Component
{
    use ImageTrait;

    public CreateForm $form;

    public $employees = [];

    public $services = [];

    public $durationTime = 0;

    public $availableSchedules = [];

    public function mount()
    {
        $this->employees = Employee::where('status', true)->get();
        $this->services = Service::with('item')
            ->whereHas('item', function ($query) {
                $query->where('status', true);
            })->get();
    }

    public function changeEmployee()
    {
        $this->getAppointments();
    }

    public function changeDate()
    {
        $this->getAppointments();
    }

    public function toggleService()
    {
        $this->durationTime = collect($this->services)
            ->whereIn('id', (array) $this->form->services)
            ->sum('duration_time');
        $this->getAppointments();
    }

    private function getAppointments()
    {
        if ($this->form->services && $this->form->employee_id && $this->form->date) {

            $day = Carbon::parse($this->form->date);

            $result = app(GetAvailableSlotsQuery::class)->execute(
                (int) $this->form->employee_id,
                $day->toDateString(),
                (int) $this->durationTime,
            );

            if (! $result->employeeWorksThatDay) {
                $this->availableSchedules = [];

                return $this->dispatch('notification-warning', [
                    'type' => 'warning',
                    'title' => 'Atención!',
                    'body' => 'El empleado no trabaja el día '.$day->dayName,
                ]);
            }

            $this->availableSchedules = $result->slots;
        }
    }

    public function save()
    {
        $this->validate();

        try {
            $this->form->store($this->durationTime);
        } catch (SlotNotAvailableException $e) {
            return $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => 'Atención!',
                'body' => $e->getMessage(),
            ]);
        }

        $this->reset(['durationTime', 'availableSchedules']);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Agenda ingresada',
        ]);
    }
}
