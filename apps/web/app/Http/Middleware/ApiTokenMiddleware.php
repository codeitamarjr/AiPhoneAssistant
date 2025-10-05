<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $incoming = $request->bearerToken() ?: $request->header('X-Api-Token');
        $expected = config('services.orchestrator.token');

        if (!is_string($incoming) || !is_string($expected) || !hash_equals($expected, $incoming)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
