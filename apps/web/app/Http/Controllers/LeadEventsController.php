<?php

namespace App\Http\Controllers;

use App\Models\Caller;
use App\Models\Lead;
use App\Models\CallLog;
use Illuminate\Http\Request;

class LeadEventsController extends Controller
{
    public function store(Request $r)
    {
        $data = $r->validate([
            'group_id'    => ['required', 'exists:groups,id'],
            'listing_id'  => ['nullable', 'exists:listings,id'],
            'call_log_id' => ['nullable', 'exists:call_logs,id'],
            'name'        => ['nullable', 'string', 'max:120'],
            'phone_e164'  => ['required', 'string', 'max:32'],
            'email'       => ['nullable', 'email', 'max:190'],
            'notes'       => ['nullable', 'string'],
            'status'      => ['nullable', 'in:new,contacted,qualified,waitlist,rejected'],
        ]);

        $caller = Caller::firstOrCreate(
            ['group_id' => $data['group_id'], 'phone_e164' => $data['phone_e164']],
            ['name' => $data['name'] ?? null]
        );
        if (($data['name'] ?? null) && !$caller->name) {
            $caller->name = $data['name'];
            $caller->save();
        }

        $lead = Lead::create([
            'group_id'    => $data['group_id'],
            'listing_id'  => $data['listing_id'] ?? null,
            'caller_id'   => $caller->id,
            'call_log_id' => $data['call_log_id'] ?? null,
            'name'        => $data['name'] ?? $caller->name,
            'phone_e164'  => $data['phone_e164'],
            'email'       => $data['email'] ?? null,
            'notes'       => $data['notes'] ?? null,
            'status'      => $data['status'] ?? 'new',
        ]);

        return response()->json(['ok' => true, 'id' => $lead->id]);
    }
}
