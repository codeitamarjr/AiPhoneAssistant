<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\TwilioCredential;

class TwilioRest
{
    public function __construct(protected TwilioCredential $cred) {}

    protected function client()
    {
        return Http::withBasicAuth($this->cred->account_sid, $this->cred->authToken())
            ->baseUrl('https://api.twilio.com/2010-04-01');
    }

    public function incomingNumbers()
    {
        return $this->client()
            ->get("/Accounts/{$this->cred->account_sid}/IncomingPhoneNumbers.json")
            ->throw()->json();
    }

    public function outgoingCallerIds()
    {
        return $this->client()
            ->get("/Accounts/{$this->cred->account_sid}/OutgoingCallerIds.json")
            ->throw()->json();
    }

    public function updateIncomingNumberWebhook(string $phoneSid, string $voiceUrl, string $fallbackUrl = null)
    {
        return $this->client()
            ->asForm()
            ->post("/Accounts/{$this->cred->account_sid}/IncomingPhoneNumbers/{$phoneSid}.json", [
                'VoiceMethod' => 'POST',
                'VoiceUrl'    => $voiceUrl,       // e.g. https://orchestrator.yourdomain.ie/twilio/voice
                'StatusCallbackMethod' => 'POST',
                'StatusCallback'       => $fallbackUrl ?? '',
            ])->throw()->json();
    }
}
