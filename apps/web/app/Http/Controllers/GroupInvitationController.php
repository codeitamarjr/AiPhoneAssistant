<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\GroupInvitation;
use App\Models\Membership;
use App\Models\User;
use App\Notifications\GroupInvitationNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GroupInvitationController extends Controller
{
    public function store(Request $request, Group $group)
    {
        $this->authorize('invite', $group);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
        ]);

        $inviter = $request->user();

        $result = DB::transaction(function () use ($data, $group, $inviter) {
            $user = User::where('email', $data['email'])->first();

            if (! $user) {
                $user = User::create([
                    'name' => $data['name'],
                    'email' => $data['email'],
                    'password' => bcrypt(Str::random(40)),
                ]);
            } else {
                if (! $user->name && $data['name']) {
                    $user->name = $data['name'];
                    $user->save();
                }

                $existingMembership = Membership::where('group_id', $group->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($existingMembership) {
                    throw ValidationException::withMessages([
                        'email' => ['This user is already a member of the workspace.'],
                    ]);
                }
            }

            Membership::firstOrCreate([
                'group_id' => $group->id,
                'user_id' => $user->id,
            ], [
                'group_id' => $group->id,
                'user_id' => $user->id,
                'role' => 'member',
            ]);

            $token = Str::uuid()->toString();

            $invitation = GroupInvitation::updateOrCreate(
                [
                    'group_id' => $group->id,
                    'email' => $data['email'],
                ],
                [
                    'inviter_id' => $inviter->id,
                    'user_id' => $user->id,
                    'name' => $data['name'],
                    'token' => $token,
                    'expires_at' => now()->addDays(14),
                    'accepted_at' => null,
                ]
            );

            if (! $invitation->wasRecentlyCreated) {
                $invitation->forceFill([
                    'created_at' => now(),
                ])->save();
            }

            return [$invitation, $user];
        });

        [$invitation, $user] = $result;

        $resetToken = Password::broker()->createToken($user);

        $user->notify(new GroupInvitationNotification($invitation, $resetToken));

        return response()->json([
            'invitation' => [
                'id' => $invitation->id,
                'name' => $invitation->name,
                'email' => $invitation->email,
                'sent_at' => $invitation->created_at?->toISOString(),
                'status' => 'pending',
            ],
        ], 201);
    }
}
