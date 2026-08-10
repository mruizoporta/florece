<?php

namespace Tests\Unit\Appointment;

use App\Application\Appointment\DTOs\CancelAppointmentData;
use App\Application\Appointment\DTOs\ChangeAppointmentEmployeeData;
use App\Application\Appointment\DTOs\RescheduleAppointmentData;
use App\Application\Appointment\Results\GetAvailableSlotsResult;
use App\Domain\Appointment\CustomerCancellationWindow;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

/**
 * Tests ligeros del módulo Appointment (sin base de datos).
 * Los flujos completos de comandos conviene cubrirlos con Feature + RefreshDatabase + sqlite.
 */
class AppointmentDomainTest extends TestCase
{
    public function test_slot_not_available_exception_message(): void
    {
        $e = SlotNotAvailableException::forRequestedSlot();

        $this->assertStringContainsString('disponible', mb_strtolower($e->getMessage()));
    }

    public function test_cancel_appointment_data_holds_id(): void
    {
        $dto = new CancelAppointmentData(42);

        $this->assertSame(42, $dto->appointmentId);
    }

    public function test_reschedule_appointment_data_holds_window(): void
    {
        $start = Carbon::parse('2026-03-21 10:00');
        $end = Carbon::parse('2026-03-21 11:00');

        $dto = new RescheduleAppointmentData(5, 9, $start, $end);

        $this->assertSame(5, $dto->appointmentId);
        $this->assertSame(9, $dto->employeeId);
        $this->assertSame('2026-03-21 10:00', $dto->startTime->format('Y-m-d H:i'));
        $this->assertSame('2026-03-21 11:00', $dto->endTime->format('Y-m-d H:i'));
    }

    public function test_change_appointment_employee_data_holds_values(): void
    {
        $dto = new ChangeAppointmentEmployeeData(8, 3);

        $this->assertSame(8, $dto->appointmentId);
        $this->assertSame(3, $dto->employeeId);
    }

    public function test_customer_cancellation_window_requires_6_hours(): void
    {
        $service = new CustomerCancellationWindow();
        $now = Carbon::parse('2026-03-21 10:00');

        $this->assertTrue($service->canCancel(Carbon::parse('2026-03-21 16:30'), $now));
        $this->assertFalse($service->canCancel(Carbon::parse('2026-03-21 15:59'), $now));
    }

    public function test_get_available_slots_result_to_api_array(): void
    {
        $result = new GetAvailableSlotsResult(true, [
            ['start' => '09:00', 'end' => '09:30'],
        ]);

        $this->assertSame([
            'employee_works_that_day' => true,
            'slots' => [['start' => '09:00', 'end' => '09:30']],
        ], $result->toApiArray());
    }
}
