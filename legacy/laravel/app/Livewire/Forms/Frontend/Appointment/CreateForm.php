<?php

namespace App\Livewire\Forms\Frontend\Appointment;

use App\Application\Appointment\Commands\CreateAppointmentCommand;
use App\Application\Appointment\DTOs\CreateAppointmentData;
use App\Mail\AppointmentNotification;
use App\Models\Employee;
use App\Models\Service;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Livewire\Attributes\Rule;
use Livewire\Form;

class CreateForm extends Form
{
    #[Rule('required|integer')]
    public ?int $employeeId = null;

    #[Rule('required|array|min:1')]
    public array $services = [];

    #[Rule('required|date|after:today')]
    public $date;

    #[Rule('required|date_format:H:i')]
    public $time = null;

    public int $durationTime = 0;

    public function setEmployee(int $employeeId): void
    {
        Employee::query()->findOrFail($employeeId);
        $this->employeeId = $employeeId;
    }

    public function employee(): ?Employee
    {
        if (! $this->employeeId) {
            return null;
        }

        return Employee::query()->find($this->employeeId);
    }

    public function calculateDurationTime(): void
    {
        $this->durationTime = (int) Service::whereIn('id', $this->services)->sum('duration_time');
    }

    public function getServices()
    {
        return Service::with('item')->whereIn('id', $this->services)->get();
    }

    public function store()
    {
        $user = Auth::user();
        $employee = $this->employee();
        abort_unless($employee, 422);

        $timeStr = is_array($this->time) ? (string) reset($this->time) : (string) $this->time;
        $startTime = Carbon::parse($this->date.' '.$timeStr);
        $endTime = $startTime->copy()->addMinutes($this->durationTime);

        $data = new CreateAppointmentData(
            name: $user->name,
            phone: null,
            typeId: 3,
            employeeId: (int) $employee->id,
            startTime: $startTime,
            endTime: $endTime,
            statusId: 2,
            serviceIds: array_map('intval', $this->services),
            customerId: (int) $user->customer->id,
        );

        $appointment = app(CreateAppointmentCommand::class)->handle($data);

        $tenant = Tenant::withoutGlobalScopes()->find($appointment->tenant_id);
        $locale = $tenant?->locale ?? config('app.locale');

        Mail::to($user->email)->locale($locale)->send(new AppointmentNotification($appointment));

        return redirect()->route('profile')->with('appointmentCreated', __('app.booking.success_saved'));
    }
}
