<?php

namespace App\Http\Controllers;

use App\Models\Caller;
use App\Models\Lead;
use App\Models\CallLog;
use App\Models\Listing;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LeadEventsController extends Controller
{
    public function store(Request $r)
    {
        $data = $r->validate([
            'listing_id'  => ['nullable', 'exists:listings,id'],
            'call_log_id' => ['nullable', 'exists:call_logs,id'],
            'name'        => ['nullable', 'string', 'max:120'],
            'phone_e164'  => ['required', 'string', 'max:32'],
            'email'       => ['nullable', 'email', 'max:190'],
            'notes'       => ['nullable', 'string'],
            'status'      => ['nullable', 'in:new,contacted,qualified,waitlist,rejected'],
        ]);

        $resolvedListingId = $data['listing_id'] ?? null;
        $groupId = null;
        $callLog = null;

        if (!empty($data['call_log_id'])) {
            $callLog = CallLog::select('id', 'group_id', 'listing_id', 'to_e164')
                ->find($data['call_log_id']);

            if ($callLog) {
                $groupId = $callLog->group_id ?? $groupId;
                $resolvedListingId = $resolvedListingId ?? $callLog->listing_id;
            }
        }

        $phoneNumber = null;
        if ($callLog?->to_e164) {
            $phoneNumber = PhoneNumber::query()
                ->select('group_id', 'listing_id')
                ->where('phone_number', $callLog->to_e164)
                ->first();
        }

        if (!$phoneNumber && $resolvedListingId) {
            $phoneNumber = PhoneNumber::query()
                ->select('group_id', 'listing_id')
                ->where('listing_id', $resolvedListingId)
                ->orderByDesc('is_active')
                ->orderByDesc('id')
                ->first();
        }

        if ($phoneNumber) {
            $groupId = $phoneNumber->group_id;
            $resolvedListingId = $phoneNumber->listing_id ?? $resolvedListingId;
        }

        if (!$groupId && $resolvedListingId) {
            $groupId = Listing::whereKey($resolvedListingId)->value('group_id');
        }

        if (!$groupId) {
            throw ValidationException::withMessages([
                'call_log_id' => 'Unable to resolve a group for this lead. Provide a call log or listing tied to a tracked phone number.',
            ]);
        }

        $caller = Caller::firstOrCreate(
            ['group_id' => $groupId, 'phone_e164' => $data['phone_e164']],
            ['name' => $data['name'] ?? null]
        );
        if (($data['name'] ?? null) && !$caller->name) {
            $caller->name = $data['name'];
            $caller->save();
        }

        $lead = Lead::create([
            'group_id'    => $groupId,
            'listing_id'  => $resolvedListingId,
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
