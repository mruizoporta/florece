<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Application\Catalog\Commands\CreateCategoryCommand;
use App\Application\Catalog\Commands\UpdateCategoryCommand;
use App\Application\Catalog\Commands\DeleteOrArchiveCategoryCommand;
use App\Application\Catalog\DTOs\CreateCategoryData;
use App\Application\Catalog\DTOs\UpdateCategoryData;
use App\Application\Catalog\DTOs\DeleteOrArchiveCategoryData;
use App\Application\Catalog\Queries\ListCategoriesQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\IndexCategoriesRequest;
use App\Http\Requests\Api\V1\Catalog\StoreCategoryRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateCategoryRequest;
use App\Http\Resources\Catalog\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class CatalogCategoriesController extends Controller
{
    public function index(
        IndexCategoriesRequest $request,
        ListCategoriesQuery $query,
    ): \Illuminate\Http\Resources\Json\AnonymousResourceCollection {
        $this->authorize('viewAny', Category::class);

        $v = $request->validated();

        $categories = $query->execute(
            search: $v['search'] ?? null,
            limit: (int) ($v['limit'] ?? 100),
        );

        return CategoryResource::collection($categories);
    }

    public function store(
        StoreCategoryRequest $request,
        CreateCategoryCommand $command,
    ): JsonResponse|Response {
        $this->authorize('create', Category::class);

        $v = $request->validated();

        try {
            $category = $command->handle(new CreateCategoryData(
                name: $v['name'],
                slug: $v['slug'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(
        UpdateCategoryRequest $request,
        Category $category,
        UpdateCategoryCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $category);

        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateCategoryData(
                categoryId: (int) $category->id,
                name: $v['name'],
                slug: $v['slug'],
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new CategoryResource($updated))->response();
    }

    public function delete(
        Category $category,
        DeleteOrArchiveCategoryCommand $command,
    ): JsonResponse|Response {
        $this->authorize('delete', $category);

        try {
            $deleted = $command->handle(new DeleteOrArchiveCategoryData(
                categoryId: (int) $category->id,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new CategoryResource($deleted))->response();
    }
}

