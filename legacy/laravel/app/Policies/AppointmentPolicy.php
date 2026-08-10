<?php

namespace App\Policies;

use App\Domain\Appointment\CustomerCancellationWindow;
use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;

class AppointmentPolicy
{
    public function __construct(
        private readonly CustomerCancellationWindow $customerCancellationWindow,
    ) {}

    public function viewAny(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        if (! $this->sameTenant($user, $appointment)) {
            return false;
        }

        return $this->staffInTenant($user) || $this->ownsAsCustomer($user, $appointment);
    }

    public function create(User $user): bool
    {
        return $this->staffInTenant($user);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $this->staffInTenant($user) && $this->sameTenant($user, $appointment);
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        if (! $this->sameTenant($user, $appointment)) {
            return false;
        }

        if ($this->staffInTenant($user)) {
            return true;
        }

        return $this->ownsAsCustomer($user, $appointment)
            && $this->customerCancellationWindow->canCancel(
                $appointment->start_time ? Carbon::parse($appointment->start_time) : null
            );
    }

    /**
     * Reprogramar hora/empleado (dashboard / API staff).
     */
    public function reschedule(User $user, Appointment $appointment): bool
    {
        if (! $this->staffInTenant($user) || ! $this->sameTenant($user, $appointment)) {
            return false;
        }

        return ! in_array((int) $appointment->status_id, [1, 5], true);
    }

    public function manageServices(User $user, Appointment $appointment): bool
    {
        return $this->update($user, $appointment) && in_array((int) $appointment->status_id, [2, 3], true);
    }

    protected function staffInTenant(User $user): bool
    {
        return (bool) $user->tenant_id && $user->hasRole('Admin');
    }

    protected function sameTenant(User $user, Appointment $appointment): bool
    {
        return $user->tenant_id && (int) $user->tenant_id === (int) $appointment->tenant_id;
    }

    protected function ownsAsCustomer(User $user, Appointment $appointment): bool
    {
        $customerId = $user->customer?->id;

        return $customerId !== null && (int) $appointment->customer_id === (int) $customerId;
    }
}
