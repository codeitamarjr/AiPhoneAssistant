<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;

class EnsureGroupContext
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user) {
            return $next($request);
        }

        if (
            $request->routeIs('onboarding')
            || $request->routeIs('logout')
            || $request->routeIs('twilio.authorize')
            || $request->routeIs('twilio.deauthorize')
            || $request->routeIs('twillio.authorize')
            || $request->routeIs('twillio.deauthorize')
        ) {
            return $next($request);
        }

        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return $next($request);
        }

        $hasGroup = $user->memberships()->exists();

        if (! $hasGroup) {
            return $this->redirectToOnboarding($request, 'Create or join a group before continuing.');
        }

        $currentGroup = $user->currentGroup;

        if (! $currentGroup) {
            $currentGroup = $user->memberships()->with('group.twilioCredential')->first()?->group;
            if ($currentGroup) {
                $user->setCurrentGroupId($currentGroup->id);
            }
        }

        if (! $currentGroup) {
            return $this->redirectToOnboarding($request, 'Create or join a group before continuing.');
        }

        $currentGroup->loadMissing('twilioCredential');

        if (! $currentGroup->twilioCredential) {
            $groupWithTwilio = $user->memberships()
                ->whereHas('group.twilioCredential')
                ->with('group.twilioCredential')
                ->first()?->group;

            if ($groupWithTwilio) {
                $user->setCurrentGroupId($groupWithTwilio->id);
                $currentGroup = $groupWithTwilio;
            } else {
                return $this->redirectToOnboarding($request, 'Connect Twilio before continuing.');
            }
        }

        return $next($request);
    }

    protected function redirectToOnboarding(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ], 409);
        }

        return redirect()->route('onboarding');
    }
}
