<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;

class CallEventsController extends Controller
{
    // POST /api/calls/start
    public function start(Request $r)
    {
        $data = $r->validate([
            'twilio_call_sid' => ['required', 'string'],
            'from_e164'      => ['required', 'string'],
            'to_e164'        => ['required', 'string'],
            'caller_name'    => ['nullable', 'string'],
            'started_at'     => ['nullable', 'date'],
            'status'         => ['nullable', 'string'],
            'meta'           => ['nullable', 'array'],
        ]);

        $from = self::normalizeE164($data['from_e164']);
        $to   = self::normalizeE164($data['to_e164']);
        $pn = PhoneNumber::query()
            ->with('listing:id')
            ->where('phone_number', $to)
            ->first();

        if (! $pn) {
            return response()->json([
                'ok' => false,
                'error' => 'Unknown destination number',
                'to_e164' => $to,
            ], 422);
        }

        $log = CallLog::updateOrCreate(
            ['twilio_call_sid' => $data['twilio_call_sid']],
            [
                'group_id'   => $pn->group_id,
                'listing_id' => $pn->listing_id,
                'from_e164'  => $from,
                'to_e164'    => $to,
                'caller_name' => $data['caller_name'] ?? null,
                'started_at' => $data['started_at'] ?? now(),
                'status'     => $data['status'] ?? 'in-progress',
                'metered_minutes' => 0,
                'meta'       => $data['meta'] ?? null,
            ]
        );

        return response()->json([
            'ok' => true,
            'id' => $log->id,
            'group_id' => $pn->group_id,
            'listing_id' => $pn->listing_id,
        ]);
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
        ]);

        $durationSeconds = $data['duration_seconds'] ?? $log->duration_seconds;
        if ($durationSeconds !== null) {
            $durationSeconds = (int) $durationSeconds;
            $log->duration_seconds = $durationSeconds;
            $log->metered_minutes = $durationSeconds > 0 ? (int) max(1, ceil($durationSeconds / 60)) : 0;
        }

        if (!empty($data['caller_name']) && empty($log->caller_name)) {
            $log->caller_name = $data['caller_name'];
        }
        if (!empty($data['meta'])) {
            $log->meta = array_merge($log->meta ?? [], $data['meta']);
        }

        $log->save();

        return response()->json(['ok' => true]);
    }

    protected static function normalizeE164(string $s): string
    {
        $s = trim($s);
        if ($s === '') return $s;
        if ($s[0] === '+') {
            return '+' . preg_replace('/\D+/', '', substr($s, 1));
        }
        return '+' . preg_replace('/\D+/', '', $s);
    }
}
