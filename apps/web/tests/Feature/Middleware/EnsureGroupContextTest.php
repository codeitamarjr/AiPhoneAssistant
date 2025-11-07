<?php

namespace Tests\Feature\Middleware;

use App\Models\Group;
use App\Models\Membership;
use App\Models\TwilioCredential;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnsureGroupContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_without_twilio_is_redirected_to_onboarding(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $group = $this->createGroupWithMembership($user);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertRedirect(route('onboarding'));

        $this->assertEquals($group->id, $user->fresh()->memberships()->first()->group_id);
    }

    public function test_verified_user_with_twilio_can_access_dashboard(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $group = $this->createGroupWithMembership($user);

        TwilioCredential::create([
            'group_id' => $group->id,
            'account_sid' => 'AC0987654321',
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertStatus(200);
    }

    public function test_user_is_switched_to_group_with_twilio_if_current_group_missing(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $groupWithout = $this->createGroupWithMembership($user);
        $groupWith = $this->createGroupWithMembership($user);

        TwilioCredential::create([
            'group_id' => $groupWith->id,
            'account_sid' => 'AC22222222222222222222222222222',
            'is_active' => true,
        ]);

        session(['current_group_id' => $groupWithout->id]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertStatus(200);

        $this->assertEquals($groupWith->id, session('current_group_id'));
    }

    public function test_twilio_routes_bypass_group_checks(): void
    {
        $user = User::factory()->create([
            'email_verified_at' => now(),
        ]);

        $this->actingAs($user)
            ->get('/twillio/authorize')
            ->assertStatus(400)
            ->assertSeeText('Missing state parameter');
    }

    private function createGroupWithMembership(User $user): Group
    {
        $group = Group::create([
            'name' => 'Workspace',
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
