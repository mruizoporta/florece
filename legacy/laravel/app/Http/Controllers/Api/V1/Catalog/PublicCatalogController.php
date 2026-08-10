<?php

namespace App\Http\Controllers\Api\V1\Catalog;

use App\Application\Catalog\Queries\ListPublicCatalogQuery;
use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\CategoryResource;
use App\Http\Resources\Catalog\ProductResource;
use App\Http\Resources\Catalog\ServiceResource;
use Illuminate\Http\JsonResponse;

class PublicCatalogController extends Controller
{
    public function index(ListPublicCatalogQuery $query): JsonResponse
    {
        $result = $query->execute();

        return response()->json([
            'categories' => CategoryResource::collection($result->categories)->resolve(),
            'services' => ServiceResource::collection($result->services)->resolve(),
            'products' => ProductResource::collection($result->products)->resolve(),
        ]);
    }
}

