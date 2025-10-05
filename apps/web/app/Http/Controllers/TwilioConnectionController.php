<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;
use App\Models\TwilioCredential;
use Illuminate\Support\Facades\Crypt;
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
                'auth_token_encrypted' => Crypt::encryptString($payload['auth_token']),
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
}
