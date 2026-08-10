<?php

namespace App\Livewire\Dashboard\Calendar;

use Livewire\Component;
use Livewire\Attributes\On;

use App\Livewire\Traits\ImageTrait;

use Carbon\Carbon;

use App\Application\Appointment\Queries\ListAppointmentsInRangeQuery;
use App\Models\Appointment;
use Facades\App\Livewire\Actions\Dashboard\Appointment\CancelAction;

class ShowCalendar extends Component
{
    use ImageTrait;

    public $start;
    public $end;

    public function mount()
    {
        $this->start = Carbon::now()->subMonth()->startOfMonth(); // Inicio del mes pasado
        $this->end = Carbon::now()->addMonth()->endOfMonth(); // Fin del próximo mes

        $appointments = app(ListAppointmentsInRangeQuery::class)->execute($this->start, $this->end);

        $events = [];

        foreach($appointments as $appointment){

            $event = [
                'id' => $appointment->id,
                'title' => $appointment->name,
                'description' => $this->getDescription($appointment->employee, $appointment->services, $appointment->type),
                'start' => Carbon::parse($appointment->start_time)->toIso8601String(),
                'end' => Carbon::parse($appointment->end_time)->toIso8601String(),
                'color' => $this->getHexcodeColor($appointment->status->bg_color)
            ];

            array_push($events, $event);
        }

        $this->dispatch('loadAppointments', $events);
    }


    public function getHexcodeColor($bg_color)
    {
        switch ($bg_color) {
            case 'danger':
                return '#e55353';
                break;

            case 'warning':
                return '#f9b115';
                break;

            case 'success':
                return '#2eb85c';
                break;

            case 'info':
                return '#3399ff';
                break;

            case 'primary':
                return '#321fdb';
                break;

            default:
                return '#9da5b1';
                break;
        }
    }


    #[On('getMonth')]
    public function getMonth($data)
    {
        $this->start =  Carbon::parse($data['start'])->format('Y-m-d');
        $this->end =  Carbon::parse($data['end'])->format('Y-m-d');
        $this->render();
    }

    /*public function getAppointments($dateStart = null, $dateEnd = null)
    {
        $this->dispatch('loadAppointments');
    }*/

    public function getDescription($employee, $services, $appointmentType)
    {
        $string = '';
        if($employee){
            $string = '<img src="' . asset($this->verySmall('storage/employees/', $employee->image)) . '"width="32px" loading="lazy">' . ' <strong>' . $employee->name . '</strong><br>';
            $string .= '<div class="mb-3"></div>';
        } else {
            $string = '<strong>Empleado: N/A</strong>';
        }

        foreach($services as $service){
            $string .= '<img src="' . asset($this->verySmall('storage/items/', $service->item->image)) . '"width="24px" loading="lazy">';
        }

        $string .= '<br> <span class="badge mt-1 bg-' . $appointmentType->bg_color . '">' . $appointmentType->name . '</span>';

        return $string;

    }

    public function cancelAppointment($appointment)
    {
        $model = Appointment::findOrFail($appointment);
        $this->authorize('cancel', $model);

        CancelAction::handle($appointment);

        $this->dispatch('notification-success', [
            'type' => 'success',
            'title' => 'Acción exitosa!',
            'body' => 'Agenda cancelada'
        ]);

        $this->dispatch('appointmentCanceled', $appointment);
    }
}
