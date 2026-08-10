<?php

namespace App\Http\Controllers\Api\V1\Employees;

use App\Application\Employees\Commands\ArchiveEmployeeCommand;
use App\Application\Employees\Commands\CreateEmployeeCommand;
use App\Application\Employees\Commands\ReplaceWeeklyScheduleCommand;
use App\Application\Employees\Commands\SyncEmployeeSocialsCommand;
use App\Application\Employees\Commands\UpdateEmployeeCommand;
use App\Application\Employees\DTOs\ArchiveEmployeeData;
use App\Application\Employees\DTOs\CreateEmployeeData;
use App\Application\Employees\DTOs\ReplaceWeeklyScheduleData;
use App\Application\Employees\DTOs\SyncEmployeeSocialsData;
use App\Application\Employees\DTOs\UpdateEmployeeData;
use App\Application\Employees\Queries\GetEmployeeDetailQuery;
use App\Application\Employees\Queries\GetWeeklyScheduleQuery;
use App\Application\Employees\Queries\ListEmployeesQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Employees\IndexEmployeesRequest;
use App\Http\Requests\Api\V1\Employees\ReplaceWeeklyScheduleRequest;
use App\Http\Requests\Api\V1\Employees\StoreEmployeeRequest;
use App\Http\Requests\Api\V1\Employees\SyncEmployeeSocialsRequest;
use App\Http\Requests\Api\V1\Employees\UpdateEmployeeRequest;
use App\Http\Resources\Employees\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class EmployeeController extends Controller
{
    public function index(IndexEmployeesRequest $request, ListEmployeesQuery $query): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Employee::class);
        $v = $request->validated();

        $employees = $query->execute(
            search: $v['search'] ?? null,
            includeArchived: (bool) ($v['include_archived'] ?? false),
            limit: (int) ($v['limit'] ?? 50),
        );

        return EmployeeResource::collection($employees);
    }

    public function show(Employee $employee, GetEmployeeDetailQuery $query): EmployeeResource
    {
        $this->authorize('view', $employee);

        return new EmployeeResource($query->execute((int) $employee->id));
    }

    public function store(StoreEmployeeRequest $request, CreateEmployeeCommand $command): JsonResponse|Response
    {
        $this->authorize('create', Employee::class);
        $v = $request->validated();

        try {
            $employee = $command->handle(new CreateEmployeeData(
                name: $v['name'],
                description: $v['description'],
                image: $v['image'],
                status: (bool) ($v['status'] ?? true),
                visiblePublic: (bool) ($v['visible_public'] ?? true),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new EmployeeResource($employee))->response()->setStatusCode(201);
    }

    public function update(
        UpdateEmployeeRequest $request,
        Employee $employee,
        UpdateEmployeeCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $employee);
        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateEmployeeData(
                employeeId: (int) $employee->id,
                name: $v['name'],
                description: $v['description'],
                image: $v['image'],
                status: (bool) $v['status'],
                visiblePublic: (bool) $v['visible_public'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new EmployeeResource($updated))->response();
    }

    public function archive(Employee $employee, ArchiveEmployeeCommand $command): JsonResponse|Response
    {
        $this->authorize('archive', $employee);

        $updated = $command->handle(new ArchiveEmployeeData((int) $employee->id));

        return (new EmployeeResource($updated))->response();
    }

    public function getSchedule(Employee $employee, GetWeeklyScheduleQuery $query): JsonResponse
    {
        $this->authorize('view', $employee);

        return response()->json([
            'employee_id' => (int) $employee->id,
            'week' => $query->execute((int) $employee->id),
        ]);
    }

    public function replaceSchedule(
        ReplaceWeeklyScheduleRequest $request,
        Employee $employee,
        ReplaceWeeklyScheduleCommand $command,
    ): JsonResponse {
        $this->authorize('manageSchedule', $employee);
        $v = $request->validated();

        try {
            $command->handle(new ReplaceWeeklyScheduleData(
                employeeId: (int) $employee->id,
                weekSlots: $this->normalizeWeek($v['week'] ?? []),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Horario semanal actualizado.']);
    }

    public function syncSocials(
        SyncEmployeeSocialsRequest $request,
        Employee $employee,
        SyncEmployeeSocialsCommand $command,
    ): JsonResponse {
        $this->authorize('manageSocials', $employee);
        $v = $request->validated();

        try {
            $command->handle(new SyncEmployeeSocialsData(
                employeeId: (int) $employee->id,
                socials: array_map(
                    fn (array $social) => [
                        'social_id' => (int) $social['social_id'],
                        'href' => (string) $social['href'],
                    ],
                    $v['socials'] ?? []
                ),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['message' => 'Redes sociales sincronizadas.']);
    }

    /**
     * @param  array<int|string, mixed>  $weekInput
     * @return array<int, array<int, array{start:string,end:string}>>
     */
    private function normalizeWeek(array $weekInput): array
    {
        $normalized = [];
        for ($day = 1; $day <= 7; $day++) {
            $slots = $weekInput[$day] ?? $weekInput[(string) $day] ?? [];
            $normalized[$day] = array_map(fn (array $slot) => [
                'start' => (string) $slot['start'],
                'end' => (string) $slot['end'],
            ], $slots);
        }

        return $normalized;
    }
}

