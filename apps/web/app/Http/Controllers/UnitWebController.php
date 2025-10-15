<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Models\Unit;
use App\Models\UnitType;
use App\Support\InventoryOptions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UnitWebController extends Controller
{
    public function index()
    {
        $groupId = $this->currentGroupId(true);

        $units = Unit::query()
            ->with(['building:id,name,address_line1', 'unitType:id,name,building_id'])
            ->where(function ($qq) use ($groupId) {
                $qq->where('group_id', $groupId)
                    ->orWhereHas('building', fn ($b) => $b->where('group_id', $groupId));
            })
            ->orderByRaw("CASE WHEN identifier IS NULL OR identifier = '' THEN 1 ELSE 0 END")
            ->orderBy('identifier')
            ->orderBy('id')
            ->get()
            ->map(function (Unit $unit) {
                return [
                    'id' => $unit->id,
                    'identifier' => $unit->identifier ?: "Unit {$unit->id}",
                    'bedrooms' => $unit->bedrooms,
                    'bathrooms' => $unit->bathrooms,
                    'rent' => $unit->rent,
                    'available_from' => optional($unit->available_from)?->toDateString(),
                    'is_active' => (bool) $unit->is_active,
                    'building' => $unit->building ? [
                        'id' => $unit->building->id,
                        'name' => $unit->building->name ?? $unit->building->address_line1,
                    ] : null,
                    'unit_type' => $unit->unitType ? [
                        'id' => $unit->unitType->id,
                        'name' => $unit->unitType->name,
                    ] : null,
                ];
            });

        return Inertia::render('Inventory/Units/index', [
            'units' => $units,
        ]);
    }

    public function create()
    {
        $groupId = $this->currentGroupId(true);

        return Inertia::render('Inventory/Units/create', [
            'defaults' => $this->defaultPayload(),
            'inventory' => InventoryOptions::forGroup($groupId),
        ]);
    }

    public function store(Request $request)
    {
        $groupId = $this->currentGroupId(true);

        $request->merge([
            'building_id' => $request->filled('building_id') ? $request->input('building_id') : null,
            'unit_type_id' => $request->filled('unit_type_id') ? $request->input('unit_type_id') : null,
        ]);

        $data = $this->validatePayload($request, $groupId);

        $buildingId = $data['building_id'] ?? null;
        $building = $buildingId ? Building::where('group_id', $groupId)->findOrFail($buildingId) : null;

        $unitTypeId = $data['unit_type_id'] ?? null;
        if ($unitTypeId) {
            $unitType = UnitType::where('id', $unitTypeId)
                ->whereHas('building', fn ($b) => $b->where('group_id', $groupId))
                ->firstOrFail();
            if ($building && $unitType->building_id !== $building->id) {
                abort(422, 'Unit type must belong to the selected building.');
            }
        }

        $data = $this->preparePayload($request, $data);
        $data['group_id'] = $groupId;
        $data['user_id'] = $request->user()->id;

        Unit::create($data);

        return redirect()->route('inventory.units.index')->with('success', 'Unit created');
    }

    public function edit(Unit $unit)
    {
        $this->authorizeUnit($unit);

        $payload = $unit->only([
            'id',
            'building_id',
            'unit_type_id',
            'identifier',
            'address_line1',
            'address_line2',
            'city',
            'county',
            'postcode',
            'bedrooms',
            'bathrooms',
            'floor_area_sqm',
            'floor_number',
            'ber',
            'furnished',
            'pets_allowed',
            'smoking_allowed',
            'rent',
            'deposit',
            'available_from',
            'min_lease_months',
            'parking',
            'heating',
            'amenities',
            'policies',
            'extra_info',
            'is_active',
        ]);
        $payload['available_from'] = optional($unit->available_from)?->format('Y-m-d');

        return Inertia::render('Inventory/Units/edit', [
            'unit' => $payload,
            'inventory' => InventoryOptions::forGroup($unit->group_id ?: $unit->building?->group_id),
        ]);
    }

    public function update(Request $request, Unit $unit)
    {
        $this->authorizeUnit($unit);
        $groupId = $unit->group_id ?: $unit->building?->group_id ?: $this->currentGroupId(true);

        $request->merge([
            'building_id' => $request->filled('building_id') ? $request->input('building_id') : null,
            'unit_type_id' => $request->filled('unit_type_id') ? $request->input('unit_type_id') : null,
        ]);

        $data = $this->validatePayload($request, $groupId, $unit->id);

        $buildingId = $data['building_id'] ?? null;
        $building = $buildingId ? Building::where('group_id', $groupId)->findOrFail($buildingId) : null;

        $unitTypeId = $data['unit_type_id'] ?? null;
        if ($unitTypeId) {
            $unitType = UnitType::where('id', $unitTypeId)
                ->whereHas('building', fn ($b) => $b->where('group_id', $groupId))
                ->firstOrFail();
            if ($building && $unitType->building_id !== $building->id) {
                abort(422, 'Unit type must belong to the selected building.');
            }
        }

        $data = $this->preparePayload($request, $data);

        $unit->update($data);

        return back()->with('success', 'Unit updated');
    }

    public function destroy(Unit $unit)
    {
        $this->authorizeUnit($unit);
        $unit->delete();

        return redirect()->route('inventory.units.index')->with('success', 'Unit deleted');
    }

    private function validatePayload(Request $request, int $groupId, ?int $unitId = null): array
    {
        return $request->validate([
            'building_id' => [
                'nullable',
                Rule::exists('buildings', 'id')->where('group_id', $groupId),
            ],
            'unit_type_id' => ['nullable', 'integer'],
            'identifier' => ['nullable', 'string', 'max:120'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'county' => ['nullable', 'string', 'max:120'],
            'postcode' => ['nullable', 'string', 'max:16'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_sqm' => ['nullable', 'integer', 'min:0'],
            'floor_number' => ['nullable', 'integer'],
            'ber' => ['nullable', 'string', 'max:20'],
            'furnished' => ['sometimes', 'boolean'],
            'pets_allowed' => ['sometimes', 'boolean'],
            'smoking_allowed' => ['sometimes', 'boolean'],
            'rent' => ['nullable', 'integer', 'min:0'],
            'deposit' => ['nullable', 'integer', 'min:0'],
            'available_from' => ['nullable', 'date'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],
            'parking' => ['nullable', 'string', 'max:120'],
            'heating' => ['nullable', 'string', 'max:120'],
            'amenities' => ['nullable'],
            'policies' => ['nullable'],
            'extra_info' => ['nullable'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    private function preparePayload(Request $request, array $data): array
    {
        foreach (['furnished', 'pets_allowed', 'smoking_allowed', 'is_active'] as $boolean) {
            if ($request->has($boolean)) {
                $data[$boolean] = $request->boolean($boolean);
            }
        }

        foreach (['bedrooms', 'bathrooms', 'floor_area_sqm', 'floor_number', 'rent', 'deposit', 'min_lease_months'] as $numeric) {
            if (array_key_exists($numeric, $data) && $data[$numeric] === '') {
                $data[$numeric] = null;
            }
        }

        foreach (['address_line1', 'address_line2', 'city', 'county', 'postcode', 'parking', 'heating', 'ber', 'identifier'] as $text) {
            if (array_key_exists($text, $data) && $data[$text] === '') {
                $data[$text] = null;
            }
        }

        if (array_key_exists('available_from', $data) && $data['available_from'] === '') {
            $data['available_from'] = null;
        }

        foreach (['amenities', 'policies', 'extra_info'] as $jsonKey) {
            if (!array_key_exists($jsonKey, $data)) {
                continue;
            }
            $value = $data[$jsonKey];
            if (is_string($value)) {
                $value = trim($value);
                if ($value === '') {
                    $data[$jsonKey] = null;
                    continue;
                }
                $decoded = json_decode($value, true);
                $data[$jsonKey] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
            } elseif (!is_array($value)) {
                $data[$jsonKey] = null;
            }
        }

        return $data;
    }

    private function defaultPayload(): array
    {
        return [
            'building_id' => null,
            'unit_type_id' => null,
            'identifier' => '',
            'address_line1' => '',
            'address_line2' => '',
            'city' => '',
            'county' => '',
            'postcode' => '',
            'bedrooms' => null,
            'bathrooms' => null,
            'floor_area_sqm' => null,
            'floor_number' => null,
            'ber' => '',
            'furnished' => true,
            'pets_allowed' => false,
            'smoking_allowed' => false,
            'rent' => null,
            'deposit' => null,
            'available_from' => null,
            'min_lease_months' => null,
            'parking' => '',
            'heating' => '',
            'amenities' => null,
            'policies' => null,
            'extra_info' => null,
            'is_active' => true,
        ];
    }

    private function authorizeUnit(Unit $unit): void
    {
        $groupId = $this->currentGroupId(true);
        $unitGroupId = $unit->group_id ?: $unit->building?->group_id;
        abort_unless($unitGroupId === $groupId, 403, 'Forbidden');
    }

    private function currentGroupId(bool $required = false): ?int
    {
        $user = auth()->user();
        $groupId = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;
        if ($required && !$groupId) {
            abort(422, 'Select or create a workspace before managing inventory.');
        }

        return $groupId;
    }
}
