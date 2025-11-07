<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use App\Models\TwilioCredential;
use App\Http\Requests\ConnectTwilioRequest;

class TwilioConnectionController extends Controller
{
    public function store(ConnectTwilioRequest $req, Group $group)
    {
        $payload = $req->validated();

        $cred = TwilioCredential::updateOrCreate(
            ['group_id' => $group->id],
            [
                'account_sid'          => $payload['account_sid'],
                'incoming_phone_e164'  => $payload['incoming_phone_e164'] ?? null,
                'incoming_phone_sid'   => $payload['incoming_phone_sid'] ?? null,
                'subaccount_sid'       => $payload['subaccount_sid'] ?? null,
                'is_active'            => true,
            ]
        );

        return response()->json([
            'saved' => true,
            'credential_id' => $cred->id,
        ], 201);
    }

    public function show(Request $request, Group $group)
    {
        $this->authorize('view', $group);

        $credential = $group->twilioCredential;

        if (! $credential) {
            return response()->json(null);
        }

        return response()->json([
            'id'                 => $credential->id,
            'account_sid'        => $credential->account_sid,
            'incoming_phone_e164'=> $credential->incoming_phone_e164,
            'incoming_phone_sid' => $credential->incoming_phone_sid,
            'subaccount_sid'     => $credential->subaccount_sid,
            'is_active'          => $credential->is_active,
            'connected_at'       => optional($credential->created_at)->toIso8601String(),
            'updated_at'         => optional($credential->updated_at)->toIso8601String(),
        ]);
    }

    public function destroy(Request $request, Group $group)
    {
        $this->authorize('update', $group);

        $credential = $group->twilioCredential;

        if ($credential) {
            $credential->delete();
        }

        return response()->json(['deleted' => true]);
    }
}
