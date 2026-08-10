<?php

namespace App\Livewire\Frontend\Appointments;

use App\Application\Appointment\Queries\GetAvailableSlotsQuery;
use App\Application\Appointment\Queries\CustomerHasPendingAppointmentQuery;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Livewire\Forms\Frontend\Appointment\CreateForm;
use App\Livewire\Traits\ImageTrait;
use App\Support\TenantDataCache;
use Carbon\Carbon;
use Livewire\Component;

class CreateAppointment extends Component
{
    use ImageTrait;

    public CreateForm $form;

    public function validationAttributes(): array
    {
        return [
            'form.employeeId' => __('app.booking.attr_employee'),
            'form.services' => __('app.booking.attr_services'),
            'form.date' => __('app.booking.attr_date'),
            'form.time' => __('app.booking.attr_time'),
        ];
    }

    public int $step = 1;

    public array $availableSchedules = [];

    public $selectedServices = [];

    public $setting;

    public function render()
    {
        $catalog = TenantDataCache::bookingCatalog();

        return view('livewire.frontend.appointments.create-appointment', [
            'employees' => $catalog['employees'],
            'services' => $catalog['services'],
            'selectedEmployee' => $this->form->employee(),
        ]);
    }

    public function selectEmployee(int $employeeId): void
    {
        $this->form->setEmployee($employeeId);
        $this->resetValidation('form.employeeId');
    }

    public function selectService(): void
    {
        $this->form->calculateDurationTime();
    }

    public function selectTime(string $time): void
    {
        $this->form->time = $time;
        $this->resetValidation('form.time');
    }

    public function changeDate(): void
    {
        $selectedDate = Carbon::parse($this->form->date);
        $today = Carbon::today();

        if ($selectedDate->lessThanOrEqualTo($today)) {
            $this->form->time = null;
            $this->availableSchedules = [];

            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => __('app.booking.notify_attention'),
                'body' => __('app.booking.date_must_be_future'),
            ]);

            return;
        }

        $this->getAppointments();
    }

    private function getAppointments(): void
    {
        $employee = $this->form->employee();

        if (! $employee || empty($this->form->services) || ! $this->form->date) {
            $this->availableSchedules = [];

            return;
        }

        $day = Carbon::parse($this->form->date);

        $result = app(GetAvailableSlotsQuery::class)->execute(
            (int) $employee->id,
            $day->toDateString(),
            (int) $this->form->durationTime,
        );

        if (! $result->employeeWorksThatDay) {
            $this->availableSchedules = [];

            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => __('app.booking.notify_attention'),
                'body' => __('app.booking.employee_not_working', [
                    'employee' => $employee->name,
                    'day' => $day->locale(app()->getLocale())->translatedFormat('l'),
                ]),
            ]);

            return;
        }

        $this->availableSchedules = $result->slots;
    }

    public function previousStep(): void
    {
        if ($this->step > 1) {
            $this->step--;
        }
    }

    public function goToStepOne(): void
    {
        $this->step = 1;
    }

    public function nextStep(): void
    {
        if ($this->step === 1) {
            $this->validateOnly('form.employeeId');
            $this->form->date = null;
            $this->form->time = null;
            $this->availableSchedules = [];
            $this->step = 2;

            return;
        }

        if ($this->step === 2) {
            $this->validateOnly('form.services');
            $this->form->calculateDurationTime();
            $this->form->date = null;
            $this->form->time = null;
            $this->availableSchedules = [];
            $this->step = 3;

            return;
        }

        if ($this->step === 3) {
            $this->validateOnly('form.date');
            $this->validateOnly('form.time');
            $this->selectedServices = $this->form->getServices();
            $this->step = 4;
        }
    }

    public function save(): void
    {
        $this->validate();

        $pendingAppointment = app(CustomerHasPendingAppointmentQuery::class)->execute(
            (int) auth()->user()->customer->id
        );

        if ($pendingAppointment) {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => __('app.booking.notify_attention'),
                'body' => __('app.booking.pending_exists'),
            ]);

            return;
        }

        try {
            $this->form->store();
        } catch (SlotNotAvailableException $e) {
            $this->dispatch('notification-warning', [
                'type' => 'warning',
                'title' => __('app.booking.notify_attention'),
                'body' => $e->getMessage(),
            ]);
        }
    }
}
