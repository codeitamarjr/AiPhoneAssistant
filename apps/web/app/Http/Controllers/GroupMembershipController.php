<?php

namespace App\Http\Controllers;

use App\Models\Group;
use App\Models\Membership;
use Illuminate\Http\Request;

class GroupMembershipController extends Controller
{
    public function destroy(Request $request, Group $group, Membership $membership)
    {
        $this->authorize('removeMember', $group);

        if ($membership->group_id !== $group->id) {
            abort(404);
        }

        if ($membership->role === 'owner') {
            return response()->json([
                'error' => 'You cannot remove the workspace owner.',
            ], 422);
        }

        if ($membership->user_id === $request->user()->id) {
            return response()->json([
                'error' => 'You cannot remove yourself from this workspace.',
            ], 422);
        }

        $membership->delete();

        return response()->json(['deleted' => true]);
    }
}

