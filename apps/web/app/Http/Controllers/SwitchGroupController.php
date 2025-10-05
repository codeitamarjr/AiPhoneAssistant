<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;

class SwitchGroupController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'group_id' => ['required', 'integer', 'exists:groups,id'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();

        if ($user->setCurrentGroupId((int)$data['group_id'])) {
            return back()->with('success', 'Active group switched.');
        }

        abort(403, 'You do not belong to that group.');
    }
}
