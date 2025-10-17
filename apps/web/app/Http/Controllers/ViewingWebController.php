<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Viewing;
use App\Models\ViewingSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ViewingWebController extends Controller
{
    public function index(Request $request): Response
    {
        $groupId = $this->requireGroupId($request);

        $listings = Listing::query()
            ->where('group_id', $groupId)
            ->orderBy('title')
            ->get(['id', 'title', 'address', 'postcode'])
            ->map(fn (Listing $listing) => [
                'id' => $listing->id,
                'title' => $listing->title,
                'address' => $listing->address,
                'postcode' => $listing->postcode,
            ])
            ->values()
            ->all();

        $slots = ViewingSlot::query()
            ->whereHas('listing', fn ($query) => $query->where('group_id', $groupId))
            ->with([
                'listing' => fn ($query) => $query->select('id', 'group_id', 'title', 'address'),
                'viewings' => fn ($query) => $query->orderBy('created_at'),
            ])
            ->orderBy('start_at')
            ->get()
            ->map(function (ViewingSlot $slot) {
                if (!$slot->relationLoaded('listing') || $slot->listing === null) {
                    return null;
                }

                return [
                    'id' => $slot->id,
                    'start_at' => optional($slot->start_at)?->toIso8601String(),
                    'capacity' => $slot->capacity,
                    'booked' => $slot->booked,
                    'remaining' => max(0, $slot->capacity - $slot->booked),
                    'listing' => [
                        'id' => $slot->listing->id,
                        'title' => $slot->listing->title,
                        'address' => $slot->listing->address,
                    ],
                    'bookings' => $slot->viewings
                        ->map(fn (Viewing $viewing) => [
                            'id' => $viewing->id,
                            'name' => $viewing->name,
                            'phone' => $viewing->phone,
                            'email' => $viewing->email,
                            'created_at' => optional($viewing->created_at)?->toIso8601String(),
                        ])
                        ->values()
                        ->all(),
                ];
            })
            ->filter()
            ->values()
            ->all();

        return Inertia::render('Appointments/Index', [
            'listings' => $listings,
            'slots' => $slots,
            'defaults' => [
                'start_at' => Carbon::now()->addDay()->startOfHour()->toIso8601String(),
                'capacity' => 4,
            ],
            'meta' => [
                'now' => Carbon::now()->toIso8601String(),
                'timezone' => config('app.timezone'),
            ],
        ]);
    }

    public function storeSlot(Request $request)
    {
        $groupId = $this->requireGroupId($request);

        $data = $request->validate([
            'listing_id' => [
                'required',
                'integer',
                Rule::exists('listings', 'id')->where(fn ($query) => $query->where('group_id', $groupId)),
            ],
            'start_at' => ['required', 'date', 'after:now'],
            'capacity' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        ViewingSlot::create([
            'listing_id' => (int) $data['listing_id'],
            'start_at' => Carbon::parse($data['start_at']),
            'capacity' => (int) $data['capacity'],
        ]);

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Viewing slot created.');
    }

    public function updateSlot(Request $request, ViewingSlot $slot)
    {
        $groupId = $this->requireGroupId($request);
        $slot->loadMissing('listing');
        $this->assertSlotBelongsToGroup($slot, $groupId);

        $minCapacity = max(1, $slot->booked);

        $data = $request->validate([
            'listing_id' => [
                'required',
                'integer',
                Rule::exists('listings', 'id')->where(fn ($query) => $query->where('group_id', $groupId)),
            ],
            'start_at' => ['required', 'date'],
            'capacity' => ['required', 'integer', 'min:' . $minCapacity, 'max:50'],
        ]);

        $slot->update([
            'listing_id' => (int) $data['listing_id'],
            'start_at' => Carbon::parse($data['start_at']),
            'capacity' => (int) $data['capacity'],
        ]);

        if ($slot->booked > $slot->capacity) {
            $slot->update(['booked' => $slot->capacity]);
        }

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Viewing slot updated.');
    }

    public function destroySlot(Request $request, ViewingSlot $slot)
    {
        $groupId = $this->requireGroupId($request);
        $slot->loadMissing(['listing', 'viewings']);
        $this->assertSlotBelongsToGroup($slot, $groupId);

        if ($slot->viewings->isNotEmpty()) {
            throw ValidationException::withMessages([
                'slot' => 'Remove or reassign bookings before deleting this slot.',
            ]);
        }

        $slot->delete();

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Viewing slot deleted.');
    }

    public function storeBooking(Request $request)
    {
        $groupId = $this->requireGroupId($request);

        $data = $request->validate([
            'viewing_slot_id' => ['required', 'integer'],
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:190'],
        ]);

        DB::transaction(function () use ($data, $groupId) {
            $slot = ViewingSlot::query()
                ->whereKey($data['viewing_slot_id'])
                ->whereHas('listing', fn ($query) => $query->where('group_id', $groupId))
                ->lockForUpdate()
                ->first();

            if (!$slot) {
                throw ValidationException::withMessages([
                    'viewing_slot_id' => 'Selected slot is no longer available.',
                ]);
            }

            if ($slot->booked >= $slot->capacity) {
                throw ValidationException::withMessages([
                    'viewing_slot_id' => 'This slot is already fully booked.',
                ]);
            }

            $slot->increment('booked');

            Viewing::create([
                'listing_id' => $slot->listing_id,
                'viewing_slot_id' => $slot->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
            ]);
        });

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Appointment booked.');
    }

    public function destroyBooking(Request $request, Viewing $viewing)
    {
        $groupId = $this->requireGroupId($request);
        $viewing->loadMissing(['listing', 'slot']);
        $this->assertViewingBelongsToGroup($viewing, $groupId);

        DB::transaction(function () use ($viewing) {
            $slot = ViewingSlot::query()
                ->whereKey($viewing->viewing_slot_id)
                ->lockForUpdate()
                ->first();

            if ($slot && $slot->booked > 0) {
                $slot->decrement('booked');
            }

            $viewing->delete();
        });

        return redirect()
            ->route('appointments.index')
            ->with('success', 'Appointment cancelled.');
    }

    private function requireGroupId(Request $request): int
    {
        $user = $request->user();

        $groupId = $user && method_exists($user, 'currentGroupId')
            ? $user->currentGroupId()
            : null;

        abort_if(!$groupId, 422, 'No active group. Please create or switch to a group.');

        return (int) $groupId;
    }

    private function assertSlotBelongsToGroup(ViewingSlot $slot, int $groupId): void
    {
        $slot->loadMissing('listing');

        abort_if(
            $slot->listing === null || $slot->listing->group_id !== $groupId,
            403,
            'You do not have access to this viewing slot.'
        );
    }

    private function assertViewingBelongsToGroup(Viewing $viewing, int $groupId): void
    {
        $viewing->loadMissing('listing');

        abort_if(
            $viewing->listing === null || $viewing->listing->group_id !== $groupId,
            403,
            'You do not have access to this appointment.'
        );
    }
}
