<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    public function status(Request $request)
    {
        $user = $request->user();
        $group = $user->memberships()->with('group.twilioCredential')->first()?->group;

        return response()->json([
            'has_group'  => (bool) $group,
            'has_twilio' => (bool) optional($group)->twilioCredential,
            'next'       => !$group ? 'create_group'
                : (!optional($group)->twilioCredential ? 'connect_twilio' : 'complete'),
            'group'      => $group,
        ]);
    }
}
