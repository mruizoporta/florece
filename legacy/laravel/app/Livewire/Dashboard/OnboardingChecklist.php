<?php

namespace App\Livewire\Dashboard;

use App\Application\Appointment\Queries\HasAppointmentsQuery;
use App\Models\Employee;
use App\Models\Service;
use Livewire\Component;

class OnboardingChecklist extends Component
{
    public function getHasServicesProperty(): bool
    {
        return Service::query()->exists();
    }

    public function getHasEmployeesProperty(): bool
    {
        return Employee::query()->exists();
    }

    public function getHasAppointmentsProperty(): bool
    {
        return app(HasAppointmentsQuery::class)->execute();
    }

    public function getIsCompleteProperty(): bool
    {
        return $this->hasServices && $this->hasEmployees && $this->hasAppointments;
    }

    public function render()
    {
        return view('livewire.dashboard.onboarding-checklist');
    }
}
