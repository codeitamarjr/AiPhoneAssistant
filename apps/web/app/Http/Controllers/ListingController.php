<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;

class ListingController extends Controller
{
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
    public function show(Listing $listing)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Listing $listing)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Listing $listing)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Listing $listing)
    {
        //
    }

    public function current()
    {
        $listing = \App\Models\Listing::where('is_current', true)->firstOrFail();
        return response()->json($listing);
    }

    public function byNumber(Request $request)
    {
        $validated = $request->validate([
            'to_e164'  => ['required', 'string']
        ]);

        $to = self::normalizeE164($validated['to_e164']);
        $groupId = $validated['group_id'] ?? null;

        $q = PhoneNumber::query()
            ->with(['listing'])
            ->where('phone_number', $to);

        $pn = $q->first();

        if (!$pn || !$pn->listing) {
            return response()->json(['message' => 'Listing not found for number'], 404);
        }

        $l = $pn->listing;

        // Return the shape your orchestrator expects (ApiListing)
        return response()->json([
            'id'                => $l->id,
            'title'             => $l->title,
            'address'           => $l->address,
            'eircode'           => $l->eircode,
            'summary'           => $l->summary,
            'monthly_rent_eur'  => $l->monthly_rent_eur,
            'deposit_eur'       => $l->deposit_eur,
            'available_from'    => optional($l->available_from)->toDateString(),
            'min_lease_months'  => $l->min_lease_months,
            'bedrooms'          => $l->bedrooms,
            'bathrooms'         => $l->bathrooms,
            'floor_area_sqm'    => $l->floor_area_sqm,
            'floor_number'      => $l->floor_number,
            'ber'               => $l->ber,
            'furnished'         => $l->furnished,
            'pets_allowed'      => $l->pets_allowed,
            'smoking_allowed'   => $l->smoking_allowed,
            'parking'           => $l->parking,
            'heating'           => $l->heating,
            'amenities'         => $l->amenities,
            'policies'          => $l->policies,
            'extra_info'        => $l->extra_info,
        ]);
    }

    protected static function normalizeE164(string $s): string
    {
        // keep leading + and digits only
        $s = trim($s);
        if ($s[0] === '+') {
            return '+' . preg_replace('/\D+/', '', substr($s, 1));
        }
        // remove non-digits, then add +
        return '+' . preg_replace('/\D+/', '', $s);
    }
}
