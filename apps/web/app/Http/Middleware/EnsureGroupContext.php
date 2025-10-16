<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureGroupContext
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if ($request->routeIs('onboarding') || $request->routeIs('logout')) {
            return $next($request);
        }

        $hasGroup = $user->memberships()->exists();

        if (! $hasGroup) {
            // For API request:
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Create or join a group before continuing.'
                ], 409);
            }
            // For Inertia page:
            return redirect()->route('onboarding');
        }

        return $next($request);
    }
}
