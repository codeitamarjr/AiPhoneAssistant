<?php

namespace App\Http\Controllers;

use App\Models\ViewingSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ViewingSlotController extends Controller
{
    public function index()
    {
        $slots = \App\Models\ViewingSlot::with('listing')
            ->whereHas('listing', fn($q) => $q->where('is_current', true))
            ->where('start_at', '>=', now())
            ->orderBy('start_at')->get();
        return response()->json($slots);
    }

    public function nextAvailable(Request $request)
    {
        $filters = $request->validate([
            'listing_id' => ['nullable', 'integer', 'exists:listings,id'],
            'mode' => ['nullable', Rule::in([ViewingSlot::MODE_OPEN, ViewingSlot::MODE_STAGGERED])],
        ]);

        $now = Carbon::now();

        $query = ViewingSlot::query()
            ->with('listing')
            ->where('start_at', '>=', $now->subMinutes(30))
            ->orderBy('start_at');

        if (!empty($filters['listing_id'])) {
            $query->where('listing_id', $filters['listing_id']);
        }

        if (!empty($filters['mode'])) {
            $query->where('mode', $filters['mode']);
        }

        $slots = $query->get();

        $best = null;

        foreach ($slots as $slot) {
            if ($slot->booked >= $slot->capacity) {
                continue;
            }

            $scheduledAt = null;

            if ($slot->isStaggered() && $slot->slot_interval_minutes) {
                $start = $slot->start_at?->copy();
                if ($start) {
                    $scheduledAt = $start->addMinutes($slot->slot_interval_minutes * $slot->booked);
                }
            } else {
                $scheduledAt = $slot->start_at?->copy();
            }

            if (!$scheduledAt || $scheduledAt->lt($now)) {
                continue;
            }

            $remaining = max(0, $slot->capacity - $slot->booked);

            if ($remaining === 0) {
                continue;
            }

            if (!$best || $scheduledAt->lt($best['scheduled_at'])) {
                $best = [
                    'slot' => $slot,
                    'scheduled_at' => $scheduledAt,
                    'remaining' => $remaining,
                ];
            }
        }

        if (!$best) {
            return response()->json([
                'message' => 'No appointments available.',
            ], 404);
        }

        $slot = $best['slot'];
        $scheduledAt = $best['scheduled_at'];
        $remaining = $best['remaining'];

        $endsAt = null;

        if ($slot->isStaggered() && $slot->slot_interval_minutes) {
            $endsAt = $scheduledAt->copy()->addMinutes($slot->slot_interval_minutes);
        }

        return response()->json([
            'slot_id' => $slot->id,
            'viewing_slot_id' => $slot->id,
            'mode' => $slot->mode,
            'interval_minutes' => $slot->slot_interval_minutes,
            'scheduled_at' => $scheduledAt->toIso8601String(),
            'available_from' => optional($slot->start_at)->toIso8601String(),
            'available_until' => optional($endsAt)->toIso8601String(),
            'capacity' => $slot->capacity,
            'booked' => $slot->booked,
            'remaining' => $remaining,
            'listing' => $slot->listing ? [
                'id' => $slot->listing->id,
                'title' => $slot->listing->title,
                'address' => $slot->listing->address,
                'postcode' => $slot->listing->postcode,
            ] : null,
            'slot_summary' => [
                'scheduled_at' => $scheduledAt->toIso8601String(),
                'window_start' => optional($slot->start_at)->toIso8601String(),
                'window_end' => optional($endsAt)->toIso8601String(),
                'mode' => $slot->mode,
                'position' => $slot->booked,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ViewingSlot $viewingSlot)
    {
        //
    }
}
