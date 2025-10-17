<?php

namespace App\Http\Controllers;

use App\Models\Viewing;
use App\Models\ViewingSlot;
use App\Services\Notifications\NotificationChannelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ViewingController extends Controller
{
    public function __construct(private readonly NotificationChannelService $notifications)
    {
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function findByPhone(Request $request)
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:40'],
            'listing_id' => ['nullable', 'integer', 'exists:listings,id'],
        ]);

        $rawPhone = trim($data['phone']);
        $normalizedPhone = preg_replace('/\s+/', '', $rawPhone);

        $query = Viewing::query()
            ->with(['slot.listing'])
            ->where(function ($builder) use ($rawPhone, $normalizedPhone) {
                $builder->where('phone', $rawPhone);
                if ($normalizedPhone !== $rawPhone) {
                    $builder->orWhere('phone', $normalizedPhone);
                }
            });

        if (!empty($data['listing_id'])) {
            $query->where('listing_id', $data['listing_id']);
        }

        $viewing = $query
            ->orderByRaw('COALESCE(scheduled_at, created_at) DESC')
            ->first();

        if (!$viewing) {
            return response()->json(['message' => 'Appointment not found'], 404);
        }

        return response()->json($this->presentViewing($viewing));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'slot_id' => ['nullable', 'integer', 'exists:viewing_slots,id'],
            'viewing_slot_id' => ['nullable', 'integer', 'exists:viewing_slots,id'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
        ]);

        $slotId = $data['viewing_slot_id'] ?? $data['slot_id'] ?? null;

        if (!$slotId) {
            throw ValidationException::withMessages([
                'viewing_slot_id' => 'Please provide a valid viewing slot.',
            ]);
        }

        $viewing = null;
        $data['phone'] = preg_replace('/\s+/', '', trim($data['phone']));

        DB::transaction(function () use ($slotId, $data, &$viewing) {
            $slot = ViewingSlot::lockForUpdate()->findOrFail($slotId);

            if ($slot->booked >= $slot->capacity) {
                throw ValidationException::withMessages([
                    'viewing_slot_id' => 'Slot full',
                ]);
            }

            $position = $slot->booked;
            $scheduledAt = null;

            if ($slot->isStaggered() && $slot->slot_interval_minutes) {
                $start = $slot->start_at?->copy();
                if ($start) {
                    $scheduledAt = $start->addMinutes($slot->slot_interval_minutes * $position);
                }
            }

            $slot->increment('booked');

            $viewing = Viewing::create([
                'listing_id' => $slot->listing_id,
                'viewing_slot_id' => $slot->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'scheduled_at' => $scheduledAt,
            ]);

            $slot->refresh();
            $slot->refreshSchedule();
        });

        $viewing = $viewing->fresh(['slot.listing']);
        $this->notifications->notifyViewingBooked($viewing);

        return response()->json($this->presentViewing($viewing), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Viewing $viewing)
    {
        $viewing->loadMissing(['slot.listing']);

        return response()->json($this->presentViewing($viewing));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Viewing $viewing)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Viewing $viewing)
    {
        $payload = $request->validate([
            'slot_id' => ['nullable', 'integer', 'exists:viewing_slots,id'],
            'viewing_slot_id' => ['nullable', 'integer', 'exists:viewing_slots,id'],
            'name' => ['sometimes', 'string', 'max:120'],
            'phone' => ['sometimes', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
        ]);

        $slotId = $payload['viewing_slot_id'] ?? $payload['slot_id'] ?? null;
        $updatedViewing = null;

        DB::transaction(function () use ($viewing, $payload, $slotId, &$updatedViewing) {
            $viewing->refresh();
            $currentSlot = ViewingSlot::lockForUpdate()->findOrFail($viewing->viewing_slot_id);
            $targetSlot = $currentSlot;

            if ($slotId && $slotId !== $viewing->viewing_slot_id) {
                $targetSlot = ViewingSlot::lockForUpdate()->findOrFail($slotId);

                if ($targetSlot->booked >= $targetSlot->capacity) {
                    throw ValidationException::withMessages([
                        'viewing_slot_id' => 'Selected slot is already full.',
                    ]);
                }

                if ($currentSlot->booked > 0) {
                    $currentSlot->decrement('booked');
                }

                $targetSlot->increment('booked');

                $viewing->viewing_slot_id = $targetSlot->id;
                $viewing->listing_id = $targetSlot->listing_id;
            }

            if (array_key_exists('name', $payload)) {
                $viewing->name = $payload['name'];
            }

            if (array_key_exists('phone', $payload)) {
                $viewing->phone = preg_replace('/\s+/', '', trim($payload['phone']));
            }

            if (array_key_exists('email', $payload)) {
                $viewing->email = $payload['email'] ?? null;
            }

            $viewing->save();

            $currentSlot->refresh();
            $currentSlot->refreshSchedule();

            if ($targetSlot->id !== $currentSlot->id) {
                $targetSlot->refresh();
                $targetSlot->refreshSchedule();
            }

            $updatedViewing = $viewing->fresh(['slot.listing']);
        });

        return response()->json($this->presentViewing($updatedViewing));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Viewing $viewing)
    {
        $viewing->loadMissing(['listing.group', 'slot.listing']);
        $notificationViewing = $viewing->replicate();
        $notificationViewing->setRelation('listing', $viewing->listing);
        $notificationViewing->setRelation('slot', $viewing->slot);

        DB::transaction(function () use ($viewing) {
            $slot = ViewingSlot::lockForUpdate()->find($viewing->viewing_slot_id);

            $viewing->delete();

            if ($slot && $slot->booked > 0) {
                $slot->decrement('booked');
                $slot->refresh();
                $slot->refreshSchedule();
            }
        });

        $this->notifications->notifyViewingCancelled($notificationViewing);

        return response()->json(['message' => 'Appointment cancelled.']);
    }

    private function presentViewing(Viewing $viewing): array
    {
        $viewing->loadMissing(['slot.listing']);

        $slot = $viewing->slot;

        return [
            'id' => $viewing->id,
            'slot_id' => $viewing->viewing_slot_id,
            'listing_id' => $viewing->listing_id,
            'name' => $viewing->name,
            'phone' => $viewing->phone,
            'email' => $viewing->email,
            'scheduled_at' => optional($viewing->scheduled_at)->toIso8601String(),
            'slot' => $slot ? [
                'id' => $slot->id,
                'mode' => $slot->mode,
                'start_at' => optional($slot->start_at)->toIso8601String(),
                'interval_minutes' => $slot->slot_interval_minutes,
                'capacity' => $slot->capacity,
                'booked' => $slot->booked,
                'remaining' => max(0, $slot->capacity - $slot->booked),
                'listing' => $slot->listing ? [
                    'id' => $slot->listing->id,
                    'title' => $slot->listing->title,
                    'address' => $slot->listing->address,
                    'postcode' => $slot->listing->postcode,
                ] : null,
            ] : null,
        ];
    }
}
