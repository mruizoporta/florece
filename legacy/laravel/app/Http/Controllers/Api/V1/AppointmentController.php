<?php

namespace App\Http\Controllers\Api\V1;

use App\Application\Appointment\Commands\CreateAppointmentCommand;
use App\Application\Appointment\Commands\RescheduleAppointmentCommand;
use App\Application\Appointment\DTOs\CreateAppointmentData;
use App\Application\Appointment\DTOs\RescheduleAppointmentData;
use App\Application\Appointment\Queries\GetAvailableSlotsQuery;
use App\Application\Appointment\Queries\GetAppointmentServicesDurationQuery;
use App\Application\Appointment\Queries\ListAppointmentsForDayQuery;
use App\Domain\Appointment\Exceptions\SlotNotAvailableException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AvailableSlotsRequest;
use App\Http\Requests\Api\V1\IndexAppointmentRequest;
use App\Http\Requests\Api\V1\RescheduleAppointmentRequest;
use App\Http\Requests\Api\V1\StoreAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Service;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class AppointmentController extends Controller
{
    public function index(IndexAppointmentRequest $request, ListAppointmentsForDayQuery $query): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Appointment::class);

        $validated = $request->validated();
        $date = $validated['date'] ?? Carbon::now()->toDateString();
        $statusIds = $validated['status_ids'] ?? null;

        $result = $query->execute(
            $date,
            $statusIds,
            null,
            'start_time',
            'asc',
            ['customer', 'employee', 'status', 'services.item', 'type'],
        );

        return AppointmentResource::collection($result->appointments)->additional([
            'meta' => [
                'date' => $result->date,
            ],
        ]);
    }

    public function availableSlots(AvailableSlotsRequest $request, GetAvailableSlotsQuery $query): JsonResponse
    {
        $this->authorize('viewAny', Appointment::class);

        $v = $request->validated();

        $result = $query->execute(
            (int) $v['employee_id'],
            Carbon::parse($v['date'])->toDateString(),
            (int) $v['duration_minutes'],
        );

        return response()->json($result->toApiArray());
    }

    public function store(StoreAppointmentRequest $request, CreateAppointmentCommand $command): JsonResponse|Response
    {
        $this->authorize('create', Appointment::class);

        $v = $request->validated();

        $serviceIds = array_map('intval', $v['service_ids']);
        $duration = (int) Service::query()->whereIn('id', $serviceIds)->sum('duration_time');
        if ($duration < 1) {
            return response()->json(['message' => 'La duración total de los servicios debe ser mayor a cero.'], 422);
        }

        $startTime = Carbon::parse($v['date'].' '.$v['time']);
        $endTime = $startTime->copy()->addMinutes($duration);

        $data = new CreateAppointmentData(
            name: $v['name'],
            phone: isset($v['phone']) && $v['phone'] !== '' ? $v['phone'] : null,
            typeId: (int) $v['type_id'],
            employeeId: (int) $v['employee_id'],
            startTime: $startTime,
            endTime: $endTime,
            statusId: isset($v['status_id']) ? (int) $v['status_id'] : 2,
            serviceIds: $serviceIds,
            customerId: isset($v['customer_id']) ? (int) $v['customer_id'] : 1,
        );

        try {
            $appointment = $command->handle($data);
        } catch (SlotNotAvailableException|\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $appointment->load(['status', 'employee']);

        return (new AppointmentResource($appointment))->response()->setStatusCode(201);
    }

    public function reschedule(
        RescheduleAppointmentRequest $request,
        Appointment $appointment,
        RescheduleAppointmentCommand $command,
        GetAppointmentServicesDurationQuery $getAppointmentServicesDurationQuery,
    ): JsonResponse|Response {
        $this->authorize('reschedule', $appointment);

        $duration = $getAppointmentServicesDurationQuery->execute((int) $appointment->id);
        if ($duration < 1) {
            return response()->json(['message' => 'La cita no tiene duración de servicios válida.'], 422);
        }

        $v = $request->validated();
        $startTime = Carbon::parse($v['date'].' '.$v['time']);
        $endTime = $startTime->copy()->addMinutes($duration);

        $data = new RescheduleAppointmentData(
            appointmentId: (int) $appointment->id,
            employeeId: (int) $v['employee_id'],
            startTime: $startTime,
            endTime: $endTime,
        );

        try {
            $updated = $command->handle($data);
        } catch (SlotNotAvailableException|\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $updated->load(['status', 'employee']);

        return new AppointmentResource($updated);
    }
}
