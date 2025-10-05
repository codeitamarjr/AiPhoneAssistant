<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use Illuminate\Http\Request;

class CallEventsController extends Controller
{
    // POST /api/calls/start
    public function start(Request $r)
    {
        $data = $r->validate([
            'group_id'       => ['required', 'exists:groups,id'],
            'twilio_call_sid' => ['required', 'string'],
            'from_e164'      => ['required', 'string'],
            'to_e164'        => ['required', 'string'],
            'caller_name'    => ['nullable', 'string'],
            'started_at'     => ['nullable', 'date'],
            'status'         => ['nullable', 'string'],
            'meta'           => ['nullable', 'array'],
        ]);

        $log = CallLog::updateOrCreate(
            ['twilio_call_sid' => $data['twilio_call_sid']],
            [
                'group_id'   => $data['group_id'],
                'from_e164'  => $data['from_e164'],
                'to_e164'    => $data['to_e164'],
                'caller_name' => $data['caller_name'] ?? null,
                'started_at' => $data['started_at'] ?? now(),
                'status'     => $data['status'] ?? 'in-progress',
                'meta'       => $data['meta'] ?? null,
            ]
        );

        return response()->json(['ok' => true, 'id' => $log->id]);
    }

    // POST /api/calls/end
    public function end(Request $r)
    {
        $data = $r->validate([
            'twilio_call_sid'  => ['required', 'string'],
            'status'           => ['required', 'string'],
            'ended_at'         => ['nullable', 'date'],
            'duration_seconds' => ['nullable', 'integer', 'min:0'],
            'caller_name'      => ['nullable', 'string'],
            'meta'             => ['nullable', 'array'],
        ]);

        $log = CallLog::where('twilio_call_sid', $data['twilio_call_sid'])->first();

        if (! $log) {
            return response()->json(['ok' => false, 'error' => 'Call not found'], 404);
        }

        $log->fill([
            'status'           => $data['status'],
            'ended_at'         => $data['ended_at'] ?? now(),
            'duration_seconds' => $data['duration_seconds'] ?? $log->duration_seconds,
        ]);

        if (!empty($data['caller_name']) && empty($log->caller_name)) {
            $log->caller_name = $data['caller_name'];
        }
        if (!empty($data['meta'])) {
            $log->meta = array_merge($log->meta ?? [], $data['meta']);
        }

        $log->save();

        return response()->json(['ok' => true]);
    }
}
