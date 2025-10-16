<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TwilioController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $groupId = $user?->currentGroupId();

        abort_unless($groupId, 404);

        $group = Group::with('twilioCredential')->findOrFail($groupId);

        $this->authorize('view', $group);

        $credential = optional($group->twilioCredential);

        return Inertia::render('settings/twilio', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
            ],
            'credential' => $credential->id ? [
                'id' => $credential->id,
                'account_sid' => $credential->account_sid,
                'incoming_phone_e164' => $credential->incoming_phone_e164,
                'incoming_phone_sid' => $credential->incoming_phone_sid,
                'subaccount_sid' => $credential->subaccount_sid,
                'is_active' => $credential->is_active,
                'connected_at' => optional($credential->created_at)->toIso8601String(),
                'updated_at' => optional($credential->updated_at)->toIso8601String(),
            ] : null,
        ]);
    }
}

