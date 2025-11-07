<?php

namespace Tests\Feature\Twilio;

use App\Jobs\SyncTwilioPhoneNumbers;
use App\Models\Group;
use App\Models\Membership;
use App\Models\TwilioCredential;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Queue;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TwilioConnectControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_connect_url_requires_app_sid(): void
    {
        config(['services.twilio_connect.app_sid' => null]);

        $user = User::factory()->create();
        $group = $this->createGroupWithMembership($user);

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/groups/{$group->id}/twilio/connect-url")
            ->assertStatus(503)
            ->assertJson([
                'message' => 'Twilio Connect is not configured. Please add TWILIO_CONNECT_APP_SID to your environment.',
            ]);
    }

    public function test_connect_url_available_without_auth_token(): void
    {
        config([
            'services.twilio_connect.app_sid' => 'CN1234567890abcdef',
            'services.twilio.auth_token' => null,
        ]);

        $user = User::factory()->create();
        $group = $this->createGroupWithMembership($user);

        Sanctum::actingAs($user);

        $response = $this->postJson("/api/v1/groups/{$group->id}/twilio/connect-url")
            ->assertOk()
            ->assertJsonStructure(['url', 'expires_at'])
            ->json();

        $this->assertStringContainsString('CN1234567890abcdef', $response['url']);
    }

    public function test_legacy_twillio_authorize_route_is_supported(): void
    {
        config(['services.twilio.auth_token' => null]);

        $this->get('/twillio/authorize')
            ->assertStatus(400)
            ->assertSeeText('Missing state parameter');
    }

    public function test_connect_callback_persists_credentials_and_redirects(): void
    {
        config(['services.twilio.auth_token' => null]);

        $user = User::factory()->create();
        $group = $this->createGroupWithMembership($user);

        Queue::fake();

        $statePayload = [
            'group_id' => $group->id,
            'user_id' => $user->id,
            'redirect_to' => route('onboarding'),
            'issued_at' => now()->timestamp,
        ];

        $state = Crypt::encryptString(json_encode($statePayload, JSON_THROW_ON_ERROR));

        $this->get('/twillio/authorize?state='.urlencode($state).'&AccountSid=AC1234567890&IncomingPhoneNumber=%2B15555555555')
            ->assertRedirect(route('onboarding').'?twilio=connected');

        $this->assertDatabaseHas('twilio_credentials', [
            'group_id' => $group->id,
            'account_sid' => 'AC1234567890',
            'incoming_phone_e164' => '+15555555555',
            'is_active' => true,
        ]);

        Queue::assertPushed(SyncTwilioPhoneNumbers::class, function (SyncTwilioPhoneNumbers $job) use ($group) {
            return $job->groupId === $group->id
                && $job->accountSid === 'AC1234567890';
        });
    }

    public function test_connect_callback_allows_group_owner_without_membership(): void
    {
        config(['services.twilio.auth_token' => null]);

        $user = User::factory()->create();
        $group = Group::create([
            'name' => 'Owner Group',
            'owner_id' => $user->id,
        ]);

        Queue::fake();

        $state = Crypt::encryptString(json_encode([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'redirect_to' => route('onboarding'),
            'issued_at' => now()->timestamp,
        ], JSON_THROW_ON_ERROR));

        $this->get('/twillio/authorize?state='.urlencode($state).'&AccountSid=ACOWNER123')
            ->assertRedirect(route('onboarding').'?twilio=connected');

        $this->assertDatabaseHas('twilio_credentials', [
            'group_id' => $group->id,
            'account_sid' => 'ACOWNER123',
        ]);

        Queue::assertPushed(SyncTwilioPhoneNumbers::class, function (SyncTwilioPhoneNumbers $job) use ($group) {
            return $job->groupId === $group->id
                && $job->accountSid === 'ACOWNER123';
        });
    }

    private function createGroupWithMembership(User $user): Group
    {
        $group = Group::create([
            'name' => 'Test Workspace',
            'owner_id' => $user->id,
        ]);

        Membership::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'role' => 'owner',
        ]);

        return $group;
    }
}
