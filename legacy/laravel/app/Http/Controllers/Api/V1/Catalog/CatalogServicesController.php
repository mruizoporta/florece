<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Application\Catalog\Commands\CreateServiceCommand;
use App\Application\Catalog\Commands\UpdateServiceCommand;
use App\Application\Catalog\Commands\ArchiveServiceCommand;
use App\Application\Catalog\DTOs\CreateServiceData;
use App\Application\Catalog\DTOs\UpdateServiceData;
use App\Application\Catalog\DTOs\ArchiveServiceData;
use App\Application\Catalog\Queries\ListServicesQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\ArchiveServiceRequest;
use App\Http\Requests\Api\V1\Catalog\IndexServicesRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateServiceRequest;
use App\Http\Requests\Api\V1\Catalog\StoreServiceRequest;
use App\Http\Resources\Catalog\ServiceResource;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CatalogServicesController extends Controller
{
    public function index(
        IndexServicesRequest $request,
        ListServicesQuery $query,
    ): AnonymousResourceCollection {
        $this->authorize('viewAny', Service::class);

        $v = $request->validated();

        $services = $query->execute(
            search: $v['search'] ?? null,
            limit: (int) ($v['limit'] ?? 50),
        );

        return ServiceResource::collection($services);
    }

    public function store(
        StoreServiceRequest $request,
        CreateServiceCommand $command,
    ): JsonResponse|Response {
        $this->authorize('create', Service::class);

        $v = $request->validated();

        try {
            $service = $command->handle(new CreateServiceData(
                categoryId: (int) $v['category_id'],
                name: $v['name'],
                slug: $v['slug'],
                price: (float) $v['price'],
                description: $v['description'],
                image: $v['image'] ?? null,
                status: isset($v['status']) ? (bool) $v['status'] : true,
                durationTime: (int) $v['duration_time'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ServiceResource($service))->response()->setStatusCode(201);
    }

    public function update(
        UpdateServiceRequest $request,
        Service $service,
        UpdateServiceCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $service);

        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateServiceData(
                serviceId: (int) $service->id,
                categoryId: (int) $v['category_id'],
                name: $v['name'],
                slug: $v['slug'],
                price: (float) $v['price'],
                description: $v['description'],
                image: $v['image'] ?? null,
                status: (bool) $v['status'],
                durationTime: (int) $v['duration_time'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ServiceResource($updated))->response();
    }

    public function archive(
        ArchiveServiceRequest $request,
        Service $service,
        ArchiveServiceCommand $command,
    ): JsonResponse|Response {
        $this->authorize('archive', $service);

        $v = $request->validated();

        try {
            $updated = $command->handle(new ArchiveServiceData(
                serviceId: (int) $service->id,
                active: (bool) ($v['active'] ?? false),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ServiceResource($updated))->response();
    }
}

