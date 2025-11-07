<?php

namespace App\Services;

use App\Models\TwilioCredential;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TwilioRest
{
    public function __construct(protected TwilioCredential $cred) {}

    protected function client()
    {
        if (! $this->cred->account_sid) {
            throw new RuntimeException('Missing connected Twilio Account SID.');
        }

        return Http::withBasicAuth($this->cred->account_sid, $this->authToken())
            ->baseUrl('https://api.twilio.com/2010-04-01');
    }

    protected function authToken(): string
    {
        $token = config('services.twilio.auth_token');

        if (! $token) {
            throw new RuntimeException('Missing Twilio auth token configuration.');
        }

        return $token;
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
