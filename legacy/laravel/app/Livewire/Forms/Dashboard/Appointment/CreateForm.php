<?php

namespace App\Livewire\Forms\Dashboard\Appointment;

use App\Application\Appointment\Commands\CreateAppointmentCommand;
use App\Application\Appointment\DTOs\CreateAppointmentData;
use App\Models\Employee;
use Carbon\Carbon;
use Livewire\Attributes\Rule;
use Livewire\Form;

class CreateForm extends Form
{
    #[Rule('required|string|max:75', as: 'nombre')]
    public string $name = '';

    #[Rule('nullable|string|max:15', as: 'teléfono')]
    public string $phone = '';

    #[Rule('required|exists:employees,id', as: 'empleado')]
    public string $employee_id = '';

    #[Rule('required|date|after_or_equal:today', as: 'calendario')]
    public string $date = '';

    #[Rule('required|date_format:H:i', as: 'horario')]
    public $time = [];

    #[Rule('required', as: 'servicios')]
    public $services = [];

    public int $type_id = 2; // local

    public function getEmployee()
    {
        return Employee::find($this->employee_id);
    }

    public function store($durationTime)
    {
        $time = is_array($this->time) ? (string) reset($this->time) : (string) $this->time;
        $startTime = Carbon::parse($this->date.' '.$time);
        $endTime = $startTime->copy()->addMinutes($durationTime);

        $data = new CreateAppointmentData(
            name: $this->name,
            phone: $this->phone !== '' ? $this->phone : null,
            typeId: $this->type_id,
            employeeId: (int) $this->employee_id,
            startTime: $startTime,
            endTime: $endTime,
            statusId: 2,
            serviceIds: array_map('intval', (array) $this->services),
            customerId: 1,
        );

        app(CreateAppointmentCommand::class)->handle($data);

        $this->reset();
    }
}
