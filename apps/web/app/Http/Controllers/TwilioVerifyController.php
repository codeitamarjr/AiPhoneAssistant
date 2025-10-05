<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\TwilioCredential;
use App\Services\TwilioRest;
use Illuminate\Http\Request;

class TwilioVerifyController extends Controller
{
    public function verify(Request $req, Group $group)
    {
        $this->authorize('update', $group);
        $cred = $group->twilioCredential;
        abort_if(!$cred, 404, 'Twilio not connected.');

        $tw = new TwilioRest($cred);

        try {
            $incoming = $tw->incomingNumbers();
        } catch (\Throwable $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 422);
        }

        // If no purchased numbers (trial), offer verified caller IDs so you know what’s available for outbound tests
        $callerIds = [];
        if (($incoming['incoming_phone_numbers'] ?? []) === []) {
            try {
                $callerIds = $tw->outgoingCallerIds();
            } catch (\Throwable $e) {
            }
        }

        return response()->json([
            'ok' => true,
            'incoming' => $incoming['incoming_phone_numbers'] ?? [],
            'caller_ids' => $callerIds['outgoing_caller_ids'] ?? [],
        ]);
    }

    public function attachNumber(Request $req, Group $group)
    {
        $this->authorize('update', $group);
        $data = $req->validate([
            'phone_sid' => ['required', 'string', 'starts_with:PN'],
            'phone_e164' => ['required', 'string'],
            'voice_webhook' => ['required', 'url'],
            'status_webhook' => ['nullable', 'url'],
        ]);

        $cred = $group->twilioCredential;
        abort_if(!$cred, 404, 'Twilio not connected.');

        // Save locally
        $cred->update([
            'incoming_phone_sid'  => $data['phone_sid'],
            'incoming_phone_e164' => $data['phone_e164'],
        ]);

        // Configure Twilio webhook
        $tw = new \App\Services\TwilioRest($cred);
        $tw->updateIncomingNumberWebhook($data['phone_sid'], $data['voice_webhook'], $data['status_webhook'] ?? null);

        return response()->json(['ok' => true]);
    }
}
