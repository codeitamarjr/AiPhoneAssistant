<?php

namespace App\Services;

use App\Models\PhoneNumber;
use Twilio\Rest\Client;

class TwilioNumberSync
{
    public function syncForGroup(int $groupId, int $userId, string $accountSid, string $authToken): void
    {
        $twilio = new Client($accountSid, $authToken);

        foreach ($twilio->incomingPhoneNumbers->read() as $num) {
            PhoneNumber::updateOrCreate(
                ['sid' => $num->sid],
                [
                    'group_id'      => $groupId,
                    'user_id'       => $userId,
                    'phone_number'  => $num->phoneNumber,
                    'friendly_name' => $num->friendlyName ?? null,
                    'country_code'  => $num->isoCountry ?? null, // <-- use isoCountry
                    'capabilities'  => isset($num->capabilities)
                        ? implode(',', array_keys(array_filter((array) $num->capabilities)))
                        : null,
                    'is_active'     => true,
                    'is_connected'  => true,
                    'meta'          => [
                        'voice_url' => $num->voiceUrl ?? null,
                        'sms_url'   => $num->smsUrl ?? null,
                    ],
                ]
            );
        }
    }
}
