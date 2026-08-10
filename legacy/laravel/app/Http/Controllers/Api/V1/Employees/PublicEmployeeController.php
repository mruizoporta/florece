<?php

namespace App\Http\Controllers\Api\V1\Employees;

use App\Application\Employees\Queries\ListPublicEmployeesQuery;
use App\Http\Controllers\Controller;
use App\Http\Resources\Employees\PublicEmployeeResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicEmployeeController extends Controller
{
    public function index(ListPublicEmployeesQuery $query): AnonymousResourceCollection
    {
        return PublicEmployeeResource::collection($query->execute());
    }
}

