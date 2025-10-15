<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Group;
use App\Models\Listing;
use App\Models\PhoneNumber;
use App\Models\Unit;
use App\Models\UnitType;
use App\Services\TwilioNumberSync;
use App\Support\InventoryOptions;
use Illuminate\Support\Collection;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ListingWebController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $gid  = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;

        // Whitelist sortable columns to avoid bad input / SQL errors
        $sortable = [
            'created_at',
            'title',
            'is_published',
        ];

        $search = trim((string) $request->get('search', ''));
        $sort   = in_array($request->get('sort', 'created_at'), $sortable, true)
            ? $request->get('sort', 'created_at')
            : 'created_at';
        $order  = $request->get('order', 'desc') === 'asc' ? 'asc' : 'desc';
        $per    = (int) ($request->get('per') ?? 10);

        $q = Listing::query()
            ->with([
                'unit' => fn ($qq) => $qq->with('building:id,name'),
                'unitType' => fn ($qq) => $qq->with('building:id,name'),
            ])
            ->withCount('advertisedUnits')
            ->when($gid, fn($qq) => $qq->where('group_id', $gid))
            ->when($search, function ($qq) use ($search) {
                $qq->where(function ($w) use ($search) {
                    $w->where('title', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhere('postcode', 'like', "%{$search}%")
                        ->orWhereHas('unit', fn ($u) => $u->where('identifier', 'like', "%{$search}%"))
                        ->orWhereHas('unit.building', fn ($b) => $b->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('unitType', fn ($t) => $t->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy($sort, $order);

        $listings = $q->paginate($per)
            ->appends($request->only('search', 'sort', 'order', 'per'))
            ->through(function (Listing $listing) {
                $unit = $listing->unit;
                $unitType = $listing->unitType;

                return [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'address' => $listing->address,
                    'postcode' => $listing->postcode,
                    'rent' => $listing->rent,
                    'bedrooms' => $listing->bedrooms,
                    'bathrooms' => $listing->bathrooms,
                    'available_from' => optional($listing->available_from)?->toDateString(),
                    'created_at' => optional($listing->created_at)?->toDateTimeString(),
                    'inventory_scope' => $listing->inventory_scope ?? Listing::SCOPE_LEGACY,
                    'inventory_summary' => $this->presentInventorySummary($listing),
                    'is_published' => (bool) $listing->is_published,
                    'unit' => $unit ? [
                        'id' => $unit->id,
                        'identifier' => $unit->identifier,
                        'building' => $unit->building ? [
                            'id' => $unit->building->id,
                            'name' => $unit->building->name,
                        ] : null,
                    ] : null,
                    'unit_type' => $unitType ? [
                        'id' => $unitType->id,
                        'name' => $unitType->name,
                        'building' => $unitType->building ? [
                            'id' => $unitType->building->id,
                            'name' => $unitType->building->name,
                        ] : null,
                    ] : null,
                ];
            });

        return Inertia::render('Listings/index', [
            'listings' => $listings,
            'filters'  => compact('search', 'sort', 'order', 'per'),
        ]);
    }

    public function create(Request $request, TwilioNumberSync $sync)
    {
        $user = $request->user();
        $groupId = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;

        $phoneNumbers = PhoneNumber::where('group_id', $groupId)
            ->where('is_active', true)
            ->get(['id', 'phone_number', 'friendly_name']);

        if ($phoneNumbers->isEmpty()) {
            $cred = optional(Group::find($groupId))->twilioCredential;
            if ($cred && $cred->account_sid && $cred->authToken()) {
                $sync->syncForGroup($groupId, $user->id, $cred->account_sid, $cred->authToken());

                // 3) Re-load after sync
                $phoneNumbers = PhoneNumber::where('group_id', $groupId)
                    ->where('is_active', true)
                    ->get(['id', 'phone_number', 'friendly_name']);
            }
        }

        $inventory = InventoryOptions::forGroup($groupId);

        return Inertia::render('Listings/create', [
            'defaults' => [
                'available_from' => now()->toDateString(),
                'furnished'      => true,
                'is_current'     => true,
                'is_published'   => false,
                'inventory_scope' => Listing::SCOPE_LEGACY,
                'unit_id' => null,
                'unit_type_id' => null,
                'advertised_unit_ids' => [],
                'phone_number_id' => $phoneNumbers->count() === 1 ? (string) $phoneNumbers->first()->id : '',
            ],
            'phoneNumbers' => $phoneNumbers,
            'inventory' => $inventory,
        ]);
    }

    public function store(Request $request)
    {
        $groupId = method_exists($request->user(), 'currentGroupId')
            ? $request->user()->currentGroupId()
            : null;

        abort_if(!$groupId, 422, 'No active group. Please create or switch to a group.');

        $data = $request->validate([
            'phone_number_id'   => [
                'nullable',
                Rule::exists('phone_numbers', 'id')->where('group_id', $groupId),
            ],

            // Inventory
            'inventory_scope'   => ['required', Rule::in([
                Listing::SCOPE_LEGACY,
                Listing::SCOPE_SINGLE_UNIT,
                Listing::SCOPE_UNIT_TYPE,
                Listing::SCOPE_COLLECTION,
            ])],
            'unit_id'           => ['nullable', 'integer'],
            'unit_type_id'      => ['nullable', 'integer'],
            'advertised_unit_ids' => ['nullable', 'array'],
            'advertised_unit_ids.*' => ['integer'],

            // Basic
            'title'            => ['required', 'string', 'max:190'],
            'address'          => ['nullable', 'string', 'max:255'],
            'postcode'         => ['nullable', 'string', 'max:16'],
            'summary'          => ['nullable', 'string'],

            // Pricing & lease
            'rent'             => ['nullable', 'integer', 'min:0'],
            'deposit'          => ['nullable', 'integer', 'min:0'],
            'available_from'   => ['nullable', 'date'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],

            // Property details
            'bedrooms'         => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms'        => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_sqm'   => ['nullable', 'integer', 'min:0'],
            'floor_number'     => ['nullable', 'integer'],
            'ber'              => ['nullable', 'string', 'max:10'],

            // Features
            'furnished'        => ['sometimes', 'boolean'],
            'pets_allowed'     => ['sometimes', 'boolean'],
            'smoking_allowed'  => ['sometimes', 'boolean'],
            'parking'          => ['nullable', 'string', 'max:100'],
            'heating'          => ['nullable', 'string', 'max:100'],

            // AI/meta (allow string or array)
            'amenities'        => ['nullable'],
            'policies'         => ['nullable'],
            'extra_info'       => ['nullable'],

            // Media & status
            'main_photo_path'  => ['nullable', 'string', 'max:255'],
            'is_current'       => ['sometimes', 'boolean'],
            'is_published'     => ['sometimes', 'boolean'],
        ]);

        $scope = $data['inventory_scope'] ?? Listing::SCOPE_LEGACY;
        $advertisedUnitIds = collect($data['advertised_unit_ids'] ?? [])
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->values();

        unset($data['advertised_unit_ids']);

        $unitId = isset($data['unit_id']) && $data['unit_id'] !== '' ? (int) $data['unit_id'] : null;
        $unitTypeId = isset($data['unit_type_id']) && $data['unit_type_id'] !== '' ? (int) $data['unit_type_id'] : null;

        if (($data['unit_id'] ?? null) === '') {
            $data['unit_id'] = null;
        }

        if (($data['unit_type_id'] ?? null) === '') {
            $data['unit_type_id'] = null;
        }

        [$unit, $unitType, $advertisedUnitIds, $advertisedUnits] = $this->resolveInventoryAssociations(
            $scope,
            $groupId,
            $unitId,
            $unitTypeId,
            $advertisedUnitIds
        );

        $this->assertLegacyFieldsWhenNeeded($scope, $data);

        $this->coerceJsonPayload($data);
        $this->coerceBooleanPayload($request, $data);
        $this->coerceNullableScalars($data, [
            'address',
            'postcode',
            'summary',
            'parking',
            'heating',
            'main_photo_path',
            'available_from',
        ]);

        $this->coerceNullableNumbers($data, [
            'rent',
            'deposit',
            'min_lease_months',
            'bedrooms',
            'bathrooms',
            'floor_area_sqm',
            'floor_number',
        ]);

        $this->normaliseAvailableFrom($scope, $data, $unit, $unitType, $advertisedUnits);

        $data['group_id'] = $groupId;
        $data['user_id']  = $request->user()->id;
        $data['unit_id'] = $unit?->id;
        $data['unit_type_id'] = $unitType?->id;

        if ($scope !== Listing::SCOPE_SINGLE_UNIT && $scope !== Listing::SCOPE_UNIT_TYPE) {
            $data['unit_id'] = null;
            $data['unit_type_id'] = null;
        }

        $listing = Listing::create($data);

        if ($scope === Listing::SCOPE_COLLECTION) {
            $listing->advertisedUnits()->sync($advertisedUnitIds->all());
        }

        if ($scope !== Listing::SCOPE_COLLECTION && $listing->advertisedUnits()->exists()) {
            $listing->advertisedUnits()->sync([]);
        }

        if ($request->filled('phone_number_id')) {
            PhoneNumber::where('group_id', $groupId)
                ->where('id', $request->input('phone_number_id'))
                ->update(['listing_id' => $listing->id]);
        }

        return redirect()->route('listings.edit', $listing)->with('success', 'Listing created');
    }

    public function edit(Listing $listing)
    {
        $this->authorizeListing($listing);

        $user = auth()->user();
        $groupId = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;
        $phoneNumbers = PhoneNumber::where('group_id', $groupId)
            ->where('is_active', true)
            ->get(['id', 'phone_number', 'friendly_name']);

        $listing->loadMissing([
            'advertisedUnits:id,identifier,building_id',
            'advertisedUnits.building:id,name',
        ]);

        // Ensure date is formatted for <input type="date">
        $payload = $listing->only([
            'id',
            // Basic
            'title',
            'address',
            'postcode',
            'summary',
            // Pricing & lease
            'rent',
            'deposit',
            'min_lease_months',
            // Property details
            'bedrooms',
            'bathrooms',
            'floor_area_sqm',
            'floor_number',
            'ber',
            // Features
            'furnished',
            'pets_allowed',
            'smoking_allowed',
            'parking',
            'heating',
            // AI/meta
            'amenities',
            'policies',
            'extra_info',
            // Media & status
            'main_photo_path',
            'is_current',
            'is_published',
            // Inventory
            'inventory_scope',
            'unit_id',
            'unit_type_id',
        ]);

        $payload['available_from'] = optional($listing->available_from)->format('Y-m-d');
        $payload['phone_number_id'] = optional($listing->phoneNumber)->id;
        $payload['advertised_unit_ids'] = $listing->advertisedUnits->pluck('id')->map(fn ($id) => (int) $id);

        return Inertia::render('Listings/edit', [
            'listing' => $payload,
            'phoneNumbers' => $phoneNumbers,
            'inventory' => InventoryOptions::forGroup($groupId),
        ]);
    }

    public function update(Request $request, Listing $listing)
    {
        $this->authorizeListing($listing);

        $groupId = method_exists($request->user(), 'currentGroupId') ? $request->user()->currentGroupId() : null;

        $data = $request->validate([
            'phone_number_id'   => [
                'nullable',
                Rule::exists('phone_numbers', 'id')->where('group_id', $groupId),
            ],

            // Inventory
            'inventory_scope'   => ['required', Rule::in([
                Listing::SCOPE_LEGACY,
                Listing::SCOPE_SINGLE_UNIT,
                Listing::SCOPE_UNIT_TYPE,
                Listing::SCOPE_COLLECTION,
            ])],
            'unit_id'           => ['nullable', 'integer'],
            'unit_type_id'      => ['nullable', 'integer'],
            'advertised_unit_ids' => ['nullable', 'array'],
            'advertised_unit_ids.*' => ['integer'],

            // Basic
            'title'            => ['required', 'string', 'max:190'],
            'address'          => ['nullable', 'string', 'max:255'],
            'postcode'         => ['nullable', 'string', 'max:16'],
            'summary'          => ['nullable', 'string'],

            // Pricing & lease
            'rent'             => ['nullable', 'integer', 'min:0'],
            'deposit'          => ['nullable', 'integer', 'min:0'],
            'available_from'   => ['nullable', 'date'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],

            // Property details
            'bedrooms'         => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms'        => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_sqm'   => ['nullable', 'integer', 'min:0'],
            'floor_number'     => ['nullable', 'integer'],
            'ber'              => ['nullable', 'string', 'max:10'],

            // Features
            'furnished'        => ['sometimes', 'boolean'],
            'pets_allowed'     => ['sometimes', 'boolean'],
            'smoking_allowed'  => ['sometimes', 'boolean'],
            'parking'          => ['nullable', 'string', 'max:100'],
            'heating'          => ['nullable', 'string', 'max:100'],

            // AI/meta
            'amenities'        => ['nullable'],
            'policies'         => ['nullable'],
            'extra_info'       => ['nullable'],

            // Media & status
            'main_photo_path'  => ['nullable', 'string', 'max:255'],
            'is_current'       => ['sometimes', 'boolean'],
            'is_published'     => ['sometimes', 'boolean'],
        ]);

        $scope = $data['inventory_scope'] ?? $listing->inventory_scope ?? Listing::SCOPE_LEGACY;
        $unitId = array_key_exists('unit_id', $data)
            ? ($data['unit_id'] === '' ? null : (int) $data['unit_id'])
            : $listing->unit_id;

        $unitTypeId = array_key_exists('unit_type_id', $data)
            ? ($data['unit_type_id'] === '' ? null : (int) $data['unit_type_id'])
            : $listing->unit_type_id;

        if (array_key_exists('unit_id', $data) && $data['unit_id'] === '') {
            $data['unit_id'] = null;
        }

        if (array_key_exists('unit_type_id', $data) && $data['unit_type_id'] === '') {
            $data['unit_type_id'] = null;
        }
        $advertisedUnitIds = collect($data['advertised_unit_ids'] ?? $listing->advertisedUnits()->pluck('id')->all())
            ->filter(fn ($id) => $id !== null && $id !== '')
            ->map(fn ($id) => (int) $id)
            ->values();

        unset($data['advertised_unit_ids']);

        [$unit, $unitType, $advertisedUnitIds, $advertisedUnits] = $this->resolveInventoryAssociations(
            $scope,
            $groupId,
            $unitId,
            $unitTypeId,
            $advertisedUnitIds
        );

        $this->assertLegacyFieldsWhenNeeded($scope, $data);

        $this->coerceJsonPayload($data);
        $this->coerceBooleanPayload($request, $data);
        $this->coerceNullableScalars($data, [
            'address',
            'postcode',
            'summary',
            'parking',
            'heating',
            'main_photo_path',
            'available_from',
        ]);

        $this->coerceNullableNumbers($data, [
            'rent',
            'deposit',
            'min_lease_months',
            'bedrooms',
            'bathrooms',
            'floor_area_sqm',
            'floor_number',
        ]);

        $this->normaliseAvailableFrom(
            $scope,
            $data,
            $unit,
            $unitType,
            $advertisedUnits,
            optional($listing->available_from)->toDateString()
        );

        $data['unit_id'] = $unit?->id;
        $data['unit_type_id'] = $unitType?->id;

        if ($scope !== Listing::SCOPE_SINGLE_UNIT && $scope !== Listing::SCOPE_UNIT_TYPE) {
            $data['unit_id'] = null;
            $data['unit_type_id'] = null;
        }

        $listing->update(collect($data)->except('phone_number_id')->all());

        if ($scope === Listing::SCOPE_COLLECTION) {
            $listing->advertisedUnits()->sync($advertisedUnitIds->all());
        } else {
            $listing->advertisedUnits()->sync([]);
        }

        PhoneNumber::where('group_id', $groupId)
            ->where('listing_id', $listing->id)
            ->update(['listing_id' => null]);

        if (!empty($data['phone_number_id'])) {
            $phone = PhoneNumber::where('group_id', $groupId)
                ->where('is_active', true)
                ->find($data['phone_number_id']);
            if ($phone) {
                $phone->listing_id = $listing->id;
                $phone->save();
            }
        }

        return back()->with('success', 'Listing updated');
    }

    public function destroy(Request $request, Listing $listing)
    {
        $this->authorizeListing($listing);
        $listing->delete();

        return redirect()->route('listings.index')->with('success', 'Listing deleted');
    }

    private function inventoryOptions(?int $groupId): array
    {
        return InventoryOptions::forGroup($groupId);
    }

    /**
     * @return array{0: ?Unit, 1: ?UnitType, 2: Collection<int, int>, 3: Collection<int, Unit>}
     */
    private function resolveInventoryAssociations(
        string $scope,
        ?int $groupId,
        ?int $unitId,
        ?int $unitTypeId,
        Collection $advertisedUnitIds
    ): array {
        if (!$groupId) {
            return [null, null, collect(), collect()];
        }

        $advertisedUnitIds = $advertisedUnitIds->unique()->values();
        $unit = null;
        $unitType = null;
        $advertisedUnits = collect();

        switch ($scope) {
            case Listing::SCOPE_SINGLE_UNIT:
                $unit = $this->requireUnitForGroup($unitId, $groupId);
                $unitType = $unit?->unitType;
                $advertisedUnitIds = collect();
                $advertisedUnits = collect([$unit])->filter();
                break;

            case Listing::SCOPE_UNIT_TYPE:
                $unitType = $this->requireUnitTypeForGroup($unitTypeId, $groupId);
                $advertisedUnitIds = collect();
                break;

            case Listing::SCOPE_COLLECTION:
                $units = $this->requireUnitsForGroup($advertisedUnitIds, $groupId);
                $advertisedUnitIds = $units->pluck('id');
                $advertisedUnits = $units;
                break;

            default:
                $unit = null;
                $unitType = null;
                $advertisedUnitIds = collect();
                $advertisedUnits = collect();
                break;
        }

        return [$unit, $unitType, $advertisedUnitIds, $advertisedUnits];
    }

    private function normaliseAvailableFrom(
        string $scope,
        array &$data,
        ?Unit $unit,
        ?UnitType $unitType,
        Collection $advertisedUnits,
        ?string $existingDate = null
    ): void {
        if (!array_key_exists('available_from', $data)) {
            return;
        }

        $current = $data['available_from'];

        if ($current instanceof \DateTimeInterface) {
            $data['available_from'] = $current->format('Y-m-d');
            return;
        }

        if (is_string($current) && trim($current) !== '') {
            return;
        }

        $fallback = null;

        switch ($scope) {
            case Listing::SCOPE_SINGLE_UNIT:
                $fallback = optional($unit?->available_from)->toDateString();
                break;
            case Listing::SCOPE_UNIT_TYPE:
                $fallback = $this->resolveAvailableFromForUnitType($unitType);
                break;
            case Listing::SCOPE_COLLECTION:
                $fallback = $this->resolveAvailableFromForUnits($advertisedUnits);
                break;
            default:
                $fallback = $existingDate;
        }

        if (!$fallback) {
            $fallback = $existingDate;
        }

        if (!$fallback) {
            $fallback = now()->toDateString();
        }

        $data['available_from'] = $fallback;
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

    private function resolveAvailableFromForUnits(Collection $units): ?string
    {
        return $units
            ->map(static fn (Unit $unit) => optional($unit->available_from)->toDateString())
            ->filter()
            ->sort()
            ->first();
    }

    private function assertLegacyFieldsWhenNeeded(string $scope, array $data): void
    {
        if ($scope !== Listing::SCOPE_LEGACY) {
            return;
        }

        $errors = [];

        if (empty($data['address'])) {
            $errors['address'] = 'Provide an address for legacy listings.';
        }

        if (!array_key_exists('rent', $data) || $data['rent'] === null || $data['rent'] === '') {
            $errors['rent'] = 'Provide a rent amount or switch to unit-based inventory.';
        }

        if (empty($data['available_from'])) {
            $errors['available_from'] = 'Provide an availability date or switch to unit-based inventory.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function presentInventorySummary(Listing $listing): string
    {
        return match ($listing->inventory_scope) {
            Listing::SCOPE_SINGLE_UNIT => $listing->unit
                ? trim(($listing->unit->identifier ?: "Unit {$listing->unit->id}") .
                    ($listing->unit->building ? ' · ' . ($listing->unit->building->name ?? 'Building') : ''))
                : 'Single unit',
            Listing::SCOPE_UNIT_TYPE => $listing->unitType
                ? trim($listing->unitType->name .
                    ($listing->unitType->building ? ' · ' . ($listing->unitType->building->name ?? 'Building') : ''))
                : 'Unit type',
            Listing::SCOPE_COLLECTION => sprintf(
                'Collection (%d units)',
                $listing->advertised_units_count ?? $listing->advertisedUnits()->count()
            ),
            default => 'Custom details',
        };
    }

    private function coerceJsonPayload(array &$data): void
    {
        foreach (['amenities', 'policies', 'extra_info'] as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $value = $data[$key];

            if (is_string($value)) {
                if (trim($value) === '') {
                    $data[$key] = null;
                    continue;
                }

                $decoded = json_decode($value, true);
                $data[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
                continue;
            }

            if (!is_array($value)) {
                $data[$key] = null;
            }
        }
    }

    private function coerceBooleanPayload(Request $request, array &$data): void
    {
        foreach (['furnished', 'pets_allowed', 'smoking_allowed', 'is_current', 'is_published'] as $key) {
            if ($request->has($key)) {
                $data[$key] = $request->boolean($key);
            }
        }
    }

    private function coerceNullableScalars(array &$data, array $keys): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            if ($data[$key] === '') {
                $data[$key] = null;
            }
        }
    }

    private function coerceNullableNumbers(array &$data, array $keys): void
    {
        foreach ($keys as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            if ($data[$key] === '' || $data[$key] === null) {
                $data[$key] = null;
                continue;
            }

            if (is_numeric($data[$key])) {
                $data[$key] = (int) $data[$key];
            } else {
                $data[$key] = null;
            }
        }
    }

    private function requireUnitForGroup(?int $unitId, int $groupId): ?Unit
    {
        if (!$unitId) {
            throw ValidationException::withMessages([
                'unit_id' => 'Select a unit to advertise.',
            ]);
        }

        $unit = Unit::with('unitType')
            ->where('id', $unitId)
            ->where(function ($qq) use ($groupId) {
                $qq->where('group_id', $groupId)
                    ->orWhereHas('building', fn ($b) => $b->where('group_id', $groupId));
            })
            ->first();

        if (!$unit) {
            throw ValidationException::withMessages([
                'unit_id' => 'The selected unit is not available in this workspace.',
            ]);
        }

        return $unit;
    }

    private function requireUnitTypeForGroup(?int $unitTypeId, int $groupId): ?UnitType
    {
        if (!$unitTypeId) {
            throw ValidationException::withMessages([
                'unit_type_id' => 'Select a unit type to advertise.',
            ]);
        }

        $unitType = UnitType::with('building')
            ->where('id', $unitTypeId)
            ->whereHas('building', fn ($b) => $b->where('group_id', $groupId))
            ->first();

        if (!$unitType) {
            throw ValidationException::withMessages([
                'unit_type_id' => 'The selected unit type is not available in this workspace.',
            ]);
        }

        return $unitType;
    }

    /**
     * @return Collection<int, Unit>
     */
    private function requireUnitsForGroup(Collection $unitIds, int $groupId): Collection
    {
        if ($unitIds->isEmpty()) {
            throw ValidationException::withMessages([
                'advertised_unit_ids' => 'Select one or more units for the collection listing.',
            ]);
        }

        $units = Unit::query()
            ->with('building')
            ->whereIn('id', $unitIds->all())
            ->where(function ($qq) use ($groupId) {
                $qq->where('group_id', $groupId)
                    ->orWhereHas('building', fn ($b) => $b->where('group_id', $groupId));
            })
            ->get();

        $missing = $unitIds->diff($units->pluck('id'));

        if ($missing->isNotEmpty()) {
            throw ValidationException::withMessages([
                'advertised_unit_ids' => 'One or more selected units are not available in this workspace.',
            ]);
        }

        return $units;
    }

    private function authorizeListing(Listing $listing): void
    {
        $user = auth()->user();
        $gid = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;
        abort_unless($gid && $listing->group_id === $gid, 403, 'Forbidden');
    }
}
