<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $groupId = $user?->currentGroupId();

        abort_unless($groupId, 404);

        $group = Group::query()
            ->with([
                'memberships.user:id,name,email',
                'invitations' => fn($query) => $query->latest()->whereNull('accepted_at'),
            ])
            ->findOrFail($groupId);

        $this->authorize('view', $group);

        $members = $group->memberships->map(fn($membership) => [
            'id' => $membership->id,
            'name' => $membership->user->name,
            'email' => $membership->user->email,
            'role' => $membership->role,
            'joined_at' => optional($membership->created_at)->toIso8601String(),
        ])->values();

        $invitations = $group->invitations->map(fn($invitation) => [
            'id' => $invitation->id,
            'name' => $invitation->name,
            'email' => $invitation->email,
            'sent_at' => optional($invitation->created_at)->toIso8601String(),
        ])->values();

        $currentMembership = $group->memberships->firstWhere('user_id', $user->id);
        $canManage = optional($currentMembership)->role === 'owner';

        return Inertia::render('settings/team', [
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
            ],
            'members' => $members,
            'invitations' => $invitations,
            'canManage' => $canManage,
        ]);
    }
}
