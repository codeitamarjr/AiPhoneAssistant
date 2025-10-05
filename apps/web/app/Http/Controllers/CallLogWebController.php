<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\CallLog;
use Illuminate\Http\Request;

class CallLogWebController extends Controller
{
    public function index(Request $r)
    {
        $user = $r->user();
        $group = $user->memberships()->with('group')->first()?->group;

        $calls = CallLog::where('group_id', $group->id)
            ->orderByDesc('started_at')
            ->paginate(20)
            ->through(fn($c) => [
                'id' => $c->id,
                'from' => $c->from_e164,
                'caller_name' => $c->caller_name,
                'to' => $c->to_e164,
                'status' => $c->status,
                'started_at' => optional($c->started_at)->toIso8601String(),
                'duration' => $c->duration_seconds,
            ]);

        return Inertia::render('Calls/Index', ['calls' => $calls]);
    }
}
