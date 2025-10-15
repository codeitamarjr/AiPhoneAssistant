<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use App\Models\Listing;
use App\Models\UnitType;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Number;
use Illuminate\Support\Collection;

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

    public function byNumber(Request $request)
    {
        $validated = $request->validate([
            'to_e164'  => ['required', 'string']
        ]);

        $to = self::normalizeE164($validated['to_e164']);
        $groupId = $validated['group_id'] ?? null;

        $q = PhoneNumber::query()
            ->with([
                'listing.unit.building',
                'listing.unitType.building',
                'listing.advertisedUnits.building',
            ])
            ->where('phone_number', $to)
            ->when($groupId, fn ($qq) => $qq->where('group_id', $groupId));

        $pn = $q->first();

        if (!$pn || !$pn->listing) {
            return response()->json(['message' => 'Listing not found for number'], 404);
        }

        $listing = $pn->listing;
        $listing->setRelation(
            'advertisedUnits',
            $listing->advertisedUnits->sortBy(fn (Unit $unit) => $unit->pivot->display_order ?? 0)->values()
        );

        return response()->json($this->formatListingForApi($listing, $pn));
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

    private function presentBuilding(Listing $listing, ?Unit $unit, ?UnitType $unitType, Collection $advertisedUnits): ?array
    {
        $building = $unit?->building
            ?? $unitType?->building
            ?? $advertisedUnits->first(fn (Unit $u) => $u->building)?->building;

        if (!$building) {
            return null;
        }

        return [
            'id'            => $building->id,
            'name'          => $building->name,
            'address_line1' => $building->address_line1,
            'address_line2' => $building->address_line2,
            'city'          => $building->city,
            'county'        => $building->county,
            'postcode'      => $building->postcode,
            'parking'       => $building->parking,
            'heating'       => $building->heating,
            'amenities'     => $building->amenities,
            'policies'      => $building->policies,
        ];
    }

    private function presentUnit(?Unit $unit): ?array
    {
        if (!$unit) {
            return null;
        }

        return [
            'id'               => $unit->id,
            'identifier'       => $unit->identifier,
            'bedrooms'         => $unit->bedrooms,
            'bathrooms'        => $unit->bathrooms,
            'floor_area_sqm'   => $unit->floor_area_sqm,
            'floor_number'     => $unit->floor_number,
            'ber'              => $unit->ber,
            'furnished'        => $unit->furnished,
            'pets_allowed'     => $unit->pets_allowed,
            'smoking_allowed'  => $unit->smoking_allowed,
            'rent'             => $unit->rent,
            'deposit'          => $unit->deposit,
            'available_from'   => optional($unit->available_from)->toDateString(),
            'min_lease_months' => $unit->min_lease_months,
            'parking'          => $unit->parking,
            'heating'          => $unit->heating,
            'amenities'        => $unit->amenities,
            'policies'         => $unit->policies,
            'extra_info'       => $unit->extra_info,
            'is_active'        => (bool) $unit->is_active,
            'building'         => $unit->building ? [
                'id'   => $unit->building->id,
                'name' => $unit->building->name,
            ] : null,
        ];
    }

    private function presentUnitType(?UnitType $unitType): ?array
    {
        if (!$unitType) {
            return null;
        }

        return [
            'id'                  => $unitType->id,
            'name'                => $unitType->name,
            'description'         => $unitType->description,
            'bedrooms'            => $unitType->bedrooms,
            'bathrooms'           => $unitType->bathrooms,
            'floor_area_min_sqm'  => $unitType->floor_area_min_sqm,
            'floor_area_max_sqm'  => $unitType->floor_area_max_sqm,
            'default_rent'        => $unitType->default_rent,
            'default_deposit'     => $unitType->default_deposit,
            'min_lease_months'    => $unitType->min_lease_months,
            'quantity_total'      => $unitType->quantity_total,
            'quantity_available'  => $unitType->quantity_available,
            'amenities'           => $unitType->amenities,
            'policies'            => $unitType->policies,
            'building'            => $unitType->building ? [
                'id'   => $unitType->building->id,
                'name' => $unitType->building->name,
            ] : null,
        ];
    }

    private function resolveAvailableFromForUnits(Collection $units): ?string
    {
        return $units
            ->map(static fn (Unit $unit) => optional($unit->available_from)->toDateString())
            ->filter()
            ->sort()
            ->first();
    }

    private function resolveAvailableFromForUnitType(?UnitType $unitType): ?string
    {
        if (!$unitType) {
            return null;
        }

        $date = Unit::query()
            ->where('unit_type_id', $unitType->id)
            ->orderBy('available_from')
            ->value('available_from');

        return $date ? (string) $date : null;
    }

    private function formatListingForApi(Listing $listing, PhoneNumber $phoneNumber): array
    {
        $scope = $listing->inventory_scope ?? Listing::SCOPE_LEGACY;
        $unit = $listing->unit;
        $unitType = $listing->unitType;
        $advertisedUnits = $listing->advertisedUnits ?? collect();

        $base = [
            'id'             => $listing->id,
            'title'          => $listing->title,
            'address'        => $listing->address,
            'postcode'       => $listing->postcode,
            'inventory_scope'=> $scope,
            'summary'        => $listing->summary,
            'building'       => $this->presentBuilding($listing, $unit, $unitType, $advertisedUnits),
            'amenities'      => $listing->amenities,
            'policies'       => $listing->policies,
            'extra_info'     => $listing->extra_info,
            'metadata'       => [
                'phone_number_id' => $phoneNumber->id,
                'group_id'        => $phoneNumber->group_id,
            ],
        ];

        if ($scope === Listing::SCOPE_COLLECTION) {
            $base['collection'] = $this->presentCollectionInventory($listing, $advertisedUnits);
            return $base;
        }

        if ($scope === Listing::SCOPE_SINGLE_UNIT) {
            $base['unit'] = $this->presentUnit($unit);
            $base['pricing'] = [
                'rent'          => $unit->rent ? Number::currency($unit->rent, 'EUR') : Number::currency($listing->rent, 'EUR'),
                'deposit'       => $unit->deposit ? Number::currency($unit->deposit, 'EUR') : Number::currency($listing->deposit, 'EUR'),
                'available_from'=> optional($unit->available_from ?? $listing->available_from)->toDateString(),
                'min_lease'     => $unit->min_lease_months ?? $listing->min_lease_months,
            ];

            return $base;
        }

        if ($scope === Listing::SCOPE_UNIT_TYPE) {
            $base['unit_type'] = $this->presentUnitType($unitType);
            $base['inventory_examples'] = $advertisedUnits->take(5)->map(fn (Unit $u) => $this->presentUnitForCollection($u))->values();
            $base['pricing'] = [
                'default_rent'   => $unitType?->default_rent ?? $advertisedUnits->whereNotNull('rent')->min('rent') ?? $listing->rent,
                'default_deposit'=> $unitType?->default_deposit ?? $advertisedUnits->whereNotNull('deposit')->min('deposit') ?? $listing->deposit,
                'available_from' => $this->resolveAvailableFromForUnitType($unitType) ?? optional($listing->available_from)->toDateString(),
                'min_lease'      => $unitType?->min_lease_months ?? $listing->min_lease_months,
            ];

            return $base;
        }

        // Legacy listings fall back to the marketing wrapper's own fields
        $base['listing_details'] = [
            'rent'             => $listing->rent,
            'deposit'          => $listing->deposit,
            'available_from'   => optional($listing->available_from)->toDateString(),
            'min_lease_months' => $listing->min_lease_months,
            'bedrooms'         => $listing->bedrooms,
            'bathrooms'        => $listing->bathrooms,
            'floor_area_sqm'   => $listing->floor_area_sqm,
            'floor_number'     => $listing->floor_number,
            'ber'              => $listing->ber,
            'furnished'        => $listing->furnished,
            'pets_allowed'     => $listing->pets_allowed,
            'smoking_allowed'  => $listing->smoking_allowed,
            'parking'          => $listing->parking,
            'heating'          => $listing->heating,
        ];

        return $base;
    }

    private function presentCollectionInventory(Listing $listing, Collection $units): array
    {
        $units = $units->values();

        $rentMin = $units->whereNotNull('rent')->min('rent');
        $rentMax = $units->whereNotNull('rent')->max('rent');

        $availability = $this->resolveAvailableFromForUnits($units)
            ?? optional($listing->available_from)->toDateString();

        return [
            'unit_count'     => $units->count(),
            'availability'   => $availability,
            'rent_range'     => [
                'min' => Number::currency($rentMin, 'EUR'),
                'max' => Number::currency($rentMax, 'EUR'),
            ],
            'unit_variations'=> $units->map(fn (Unit $unit) => $this->presentUnitForCollection($unit))->values(),
        ];
    }

    private function presentUnitForCollection(Unit $unit): array
    {
        return [
            'id'              => $unit->id,
            'label'           => $this->labelForUnit($unit),
            'bedrooms'        => $unit->bedrooms,
            'bathrooms'       => $unit->bathrooms,
            'floor_area_sqm'  => $unit->floor_area_sqm,
            'rent'            => Number::currency($unit->rent, 'EUR'),
            'deposit'         => Number::currency($unit->deposit, 'EUR'),
            'available_from'  => optional($unit->available_from)->toDateString(),
            'min_lease_months'=> $unit->min_lease_months,
            'furnished'       => $unit->furnished,
            'pets_allowed'    => $unit->pets_allowed,
            'smoking_allowed' => $unit->smoking_allowed,
            'parking'         => $unit->parking,
            'heating'         => $unit->heating,
            'notes'           => $unit->extra_info,
        ];
    }

    private function labelForUnit(Unit $unit): string
    {
        if ($unit->identifier) {
            return $unit->identifier;
        }

        if ($unit->bedrooms !== null) {
            return $unit->bedrooms === 0
                ? 'Studio'
                : sprintf('%d bedroom', $unit->bedrooms);
        }

        return sprintf('Unit %d', $unit->id);
    }
}
