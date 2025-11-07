<?php

namespace App\Jobs;

use App\Services\TwilioNumberSync;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncTwilioPhoneNumbers implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $groupId,
        public int $userId,
        public string $accountSid
    ) {}

    public function handle(TwilioNumberSync $sync): void
    {
        $authToken = config('services.twilio.auth_token');

        if (! $authToken) {
            Log::warning('Skipped Twilio number sync because TWILIO_AUTH_TOKEN is missing.', [
                'group_id' => $this->groupId,
            ]);
            return;
        }

        $sync->syncForGroup($this->groupId, $this->userId, $this->accountSid, $authToken);
    }
}
