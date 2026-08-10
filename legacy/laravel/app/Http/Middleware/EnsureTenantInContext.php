<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantInContext
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Tenant::current() === null) {
            return response()->json([
                'message' => 'Se requiere contexto de salón (usuario con tenant asignado).',
            ], 403);
        }

        return $next($request);
    }
}
