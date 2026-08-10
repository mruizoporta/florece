<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Application\Catalog\Commands\CreateProductCommand;
use App\Application\Catalog\Commands\UpdateProductCommand;
use App\Application\Catalog\Commands\ArchiveProductCommand;
use App\Application\Catalog\Commands\UpdateStockCommand;
use App\Application\Catalog\DTOs\CreateProductData;
use App\Application\Catalog\DTOs\UpdateProductData;
use App\Application\Catalog\DTOs\ArchiveProductData;
use App\Application\Catalog\DTOs\UpdateStockData;
use App\Application\Catalog\Queries\ListProductsQuery;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Catalog\ArchiveProductRequest;
use App\Http\Requests\Api\V1\Catalog\IndexProductsRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateProductRequest;
use App\Http\Requests\Api\V1\Catalog\StoreProductRequest;
use App\Http\Requests\Api\V1\Catalog\UpdateStockRequest;
use App\Http\Resources\Catalog\ProductResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class CatalogProductsController extends Controller
{
    public function index(
        IndexProductsRequest $request,
        ListProductsQuery $query,
    ): AnonymousResourceCollection {
        $this->authorize('viewAny', Product::class);

        $v = $request->validated();

        $products = $query->execute(
            search: $v['search'] ?? null,
            limit: (int) ($v['limit'] ?? 50),
        );

        return ProductResource::collection($products);
    }

    public function store(
        StoreProductRequest $request,
        CreateProductCommand $command,
    ): JsonResponse|Response {
        $this->authorize('create', Product::class);

        $v = $request->validated();

        try {
            $product = $command->handle(new CreateProductData(
                categoryId: (int) $v['category_id'],
                name: $v['name'],
                slug: $v['slug'],
                price: (float) $v['price'],
                description: $v['description'],
                image: $v['image'] ?? null,
                status: isset($v['status']) ? (bool) $v['status'] : true,
                stock: (int) $v['stock'],
                stockAlert: (int) ($v['stock_alert'] ?? 5),
                longDescription: $v['long_description'] ?? null,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(
        UpdateProductRequest $request,
        Product $product,
        UpdateProductCommand $command,
    ): JsonResponse|Response {
        $this->authorize('update', $product);

        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateProductData(
                productId: (int) $product->id,
                categoryId: (int) $v['category_id'],
                name: $v['name'],
                slug: $v['slug'],
                price: (float) $v['price'],
                description: $v['description'],
                image: $v['image'] ?? null,
                status: (bool) $v['status'],
                stock: (int) $v['stock'],
                stockAlert: (int) $v['stock_alert'],
                longDescription: $v['long_description'] ?? null,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ProductResource($updated))->response();
    }

    public function archive(
        ArchiveProductRequest $request,
        Product $product,
        ArchiveProductCommand $command,
    ): JsonResponse|Response {
        $this->authorize('archive', $product);

        $v = $request->validated();

        try {
            $updated = $command->handle(new ArchiveProductData(
                productId: (int) $product->id,
                active: (bool) ($v['active'] ?? false),
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ProductResource($updated))->response();
    }

    public function updateStock(
        UpdateStockRequest $request,
        Product $product,
        UpdateStockCommand $command,
    ): JsonResponse|Response {
        $this->authorize('manageStock', $product);

        $v = $request->validated();

        try {
            $updated = $command->handle(new UpdateStockData(
                productId: (int) $product->id,
                stock: (int) $v['stock'],
                stockAlert: isset($v['stock_alert']) ? (int) $v['stock_alert'] : null,
            ));
        } catch (\DomainException|\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return (new ProductResource($updated))->response();
    }
}

