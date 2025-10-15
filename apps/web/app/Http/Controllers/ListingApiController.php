<?php
// app/Http/Controllers/ListingApiController.php
namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;

class ListingApiController extends Controller
{
    public function active(Request $r)
    {
        $r->validate(['group_id' => ['required', 'exists:groups,id']]);

        $listing = Listing::where('group_id', $r->group_id)->latest('id')->first();
        if (!$listing) return response()->json(null);

        $faqs = $listing->faqs()->orderByDesc('weight')->get(['question', 'answer']);
        $slots = $listing->viewingSlots()
            ->where('start_at', '>', now())
            ->orderBy('start_at')->limit(10)->get(['id', 'start_at', 'capacity', 'booked']);

        return [
            'id' => $listing->id,
            'title' => $listing->title ?? null,
            'address' => $listing->address ?? null,
            'rent_eur' => $listing->rent ?? null,
            'available_from' => optional($listing->available_from ?? null)?->toDateString(),
            'bedrooms' => $listing->bedrooms ?? null,
            'bathrooms' => $listing->bathrooms ?? null,
            'amenities' => $listing->amenities ?? null, // JSON if present
            'policies' => $listing->policies ?? null,   // JSON if present
            'faqs' => $faqs,
            'viewing_slots' => $slots,
        ];
    }
}
