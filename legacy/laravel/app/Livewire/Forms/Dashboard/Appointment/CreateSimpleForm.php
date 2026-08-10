<?php

namespace App\Livewire\Forms\Dashboard\Appointment;

use App\Application\Appointment\Commands\CreateSimpleAppointmentCommand;
use App\Application\Appointment\DTOs\CreateSimpleAppointmentData;
use Livewire\Attributes\Rule;
use Livewire\Form;

class CreateSimpleForm extends Form
{
    #[Rule('required|string|max:75', as: 'nombre')]
    public string $name = '';

    public int $type_id = 1;

    public function store()
    {
        app(CreateSimpleAppointmentCommand::class)->handle(
            new CreateSimpleAppointmentData(name: $this->name, typeId: $this->type_id)
        );
        $this->reset();
    }
}
