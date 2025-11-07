<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Twilio\Rest\Client;
use App\Models\PhoneNumber;

class TwilioNumberSyncController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();
        $groupId = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;
        abort_if(!$groupId, 422, 'No active group selected.');

        // Your Group has one TwilioCredential (you mentioned this relation exists)
        $cred = optional($user->memberships()->where('group_id', $groupId)->first())->group->twilioCredential
            ?? \App\Models\TwilioCredential::where('group_id', $groupId)->first();

        abort_if(! $cred || ! $cred->account_sid, 422, 'Twilio Connect is not configured for this workspace.');

        $authToken = config('services.twilio.auth_token');
        abort_if(empty($authToken), 422, 'Missing TWILIO_AUTH_TOKEN configuration.');

        $twilio = new Client($cred->account_sid, $authToken);

        // Fetch all incoming numbers from Twilio
        $incoming = $twilio->incomingPhoneNumbers->read([], 100); // up to 100; paginate if you need more

        // Keep track of which SIDs we saw, to optionally disable stale ones
        $seenSids = [];

        foreach ($incoming as $num) {
            // Twilio fields
            $sid           = $num->sid;                   // PNxxxxxxxx
            $phone         = $num->phoneNumber;          // E.164
            $friendly      = $num->friendlyName;         // label
            $isoCountry    = $num->isoCountry ?? null;   // e.g. "US", "IE"
            $caps          = $num->capabilities ?? [];   // object with voice/sms/mms
            $capString     = $this->capsToString($caps); // e.g. "voice,sms"

            $seenSids[] = $sid;

            // Upsert by SID (prefer) or phone number as fallback
            PhoneNumber::updateOrCreate(
                ['sid' => $sid],
                [
                    'group_id'      => $groupId,
                    'user_id'       => $user->id,
                    'phone_number'  => $phone,
                    'friendly_name' => $friendly,
                    'country_code'  => $isoCountry,
                    'capabilities'  => $capString,
                    'is_active'     => true,
                    // You can set this true if you’ve completed webhook setup
                    'is_connected'  => true,
                    'meta'          => [
                        'voice_url'   => $num->voiceUrl ?? null,
                        'status_url'  => $num->statusCallback ?? null,
                    ],
                ]
            );
        }

        // Optionally mark numbers for this group that are no longer in Twilio as inactive
        PhoneNumber::where('group_id', $groupId)
            ->whereNotNull('sid')
            ->whereNotIn('sid', $seenSids)
            ->update(['is_active' => false]);

        return back()->with('success', 'Synced phone numbers from Twilio.');
    }

    private function capsToString($caps): string
    {
        if (is_array($caps)) {
            // Twilio sometimes returns an object; sometimes array
            $keys = [];
            foreach ($caps as $k => $v) {
                if ($v) $keys[] = $k;
            }
            return implode(',', $keys);
        }
        if (is_object($caps)) {
            $keys = [];
            foreach (get_object_vars($caps) as $k => $v) {
                if ($v) $keys[] = $k;
            }
            return implode(',', $keys);
        }
        return '';
    }
}
