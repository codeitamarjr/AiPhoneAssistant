<?php

namespace App\Http\Controllers;

use App\Models\UnitType;
use App\Support\InventoryOptions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UnitTypeWebController extends Controller
{
    public function index()
    {
        $groupId = $this->currentGroupId(true);

        $unitTypes = UnitType::query()
            ->with('building:id,name,address_line1,group_id')
            ->whereHas('building', fn ($b) => $b->where('group_id', $groupId))
            ->orderBy('name')
            ->get()
            ->map(function (UnitType $unitType) {
                return [
                    'id' => $unitType->id,
                    'name' => $unitType->name,
                    'description' => $unitType->description,
                    'bedrooms' => $unitType->bedrooms,
                    'bathrooms' => $unitType->bathrooms,
                    'default_rent' => $unitType->default_rent,
                    'quantity_available' => $unitType->quantity_available,
                    'quantity_total' => $unitType->quantity_total,
                    'building' => $unitType->building ? [
                        'id' => $unitType->building->id,
                        'name' => $unitType->building->name ?? $unitType->building->address_line1,
                    ] : null,
                ];
            });

        return Inertia::render('Inventory/UnitTypes/index', [
            'unitTypes' => $unitTypes,
        ]);
    }

    public function create()
    {
        $groupId = $this->currentGroupId(true);

        return Inertia::render('Inventory/UnitTypes/create', [
            'defaults' => [
                'name' => '',
                'description' => '',
                'building_id' => null,
                'bedrooms' => null,
                'bathrooms' => null,
                'floor_area_min_sqm' => null,
                'floor_area_max_sqm' => null,
                'default_rent' => null,
                'default_deposit' => null,
                'min_lease_months' => null,
                'quantity_total' => null,
                'quantity_available' => null,
                'amenities' => null,
                'policies' => null,
            ],
            'inventory' => InventoryOptions::forGroup($groupId),
        ]);
    }

    public function store(Request $request)
    {
        $groupId = $this->currentGroupId(true);

        $data = $request->validate([
            'building_id' => [
                'required',
                Rule::exists('buildings', 'id')->where('group_id', $groupId),
            ],
            'name' => ['required', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_min_sqm' => ['nullable', 'integer', 'min:0'],
            'floor_area_max_sqm' => ['nullable', 'integer', 'min:0'],
            'default_rent' => ['nullable', 'integer', 'min:0'],
            'default_deposit' => ['nullable', 'integer', 'min:0'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],
            'quantity_total' => ['nullable', 'integer', 'min:0'],
            'quantity_available' => ['nullable', 'integer', 'min:0'],
            'amenities' => ['nullable'],
            'policies' => ['nullable'],
        ]);

        $data = $this->preparePayload($data);

        $unitType = UnitType::create($data);

        return redirect()->route('inventory.unit-types.edit', $unitType)->with('success', 'Unit type created');
    }

    public function edit(UnitType $unitType)
    {
        $this->authorizeUnitType($unitType);

        $payload = $unitType->only([
            'id',
            'building_id',
            'name',
            'description',
            'bedrooms',
            'bathrooms',
            'floor_area_min_sqm',
            'floor_area_max_sqm',
            'default_rent',
            'default_deposit',
            'min_lease_months',
            'quantity_total',
            'quantity_available',
            'amenities',
            'policies',
        ]);

        return Inertia::render('Inventory/UnitTypes/edit', [
            'unitType' => $payload,
            'inventory' => InventoryOptions::forGroup($unitType->building?->group_id),
        ]);
    }

    public function update(Request $request, UnitType $unitType)
    {
        $this->authorizeUnitType($unitType);

        $groupId = $unitType->building?->group_id ?? $this->currentGroupId(true);

        $data = $request->validate([
            'building_id' => [
                'required',
                Rule::exists('buildings', 'id')->where('group_id', $groupId),
            ],
            'name' => ['required', 'string', 'max:190'],
            'description' => ['nullable', 'string'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_min_sqm' => ['nullable', 'integer', 'min:0'],
            'floor_area_max_sqm' => ['nullable', 'integer', 'min:0'],
            'default_rent' => ['nullable', 'integer', 'min:0'],
            'default_deposit' => ['nullable', 'integer', 'min:0'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],
            'quantity_total' => ['nullable', 'integer', 'min:0'],
            'quantity_available' => ['nullable', 'integer', 'min:0'],
            'amenities' => ['nullable'],
            'policies' => ['nullable'],
        ]);

        $data = $this->preparePayload($data);

        $unitType->update($data);

        return back()->with('success', 'Unit type updated');
    }

    public function destroy(UnitType $unitType)
    {
        $this->authorizeUnitType($unitType);

        if ($unitType->units()->exists()) {
            throw ValidationException::withMessages([
                'unit_type' => 'Detach or update units referencing this type before deleting it.',
            ]);
        }

        $unitType->delete();

        return redirect()->route('inventory.unit-types.index')->with('success', 'Unit type deleted');
    }

    private function preparePayload(array $data): array
    {
        foreach (['bedrooms', 'bathrooms', 'floor_area_min_sqm', 'floor_area_max_sqm', 'default_rent', 'default_deposit', 'min_lease_months', 'quantity_total', 'quantity_available'] as $numeric) {
            if (array_key_exists($numeric, $data) && $data[$numeric] === '') {
                $data[$numeric] = null;
            }
        }

        foreach (['description'] as $textKey) {
            if (array_key_exists($textKey, $data) && $data[$textKey] === '') {
                $data[$textKey] = null;
            }
        }

        foreach (['amenities', 'policies'] as $jsonKey) {
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

    private function authorizeUnitType(UnitType $unitType): void
    {
        $groupId = $this->currentGroupId(true);
        abort_unless($unitType->building && $unitType->building->group_id === $groupId, 403, 'Forbidden');
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
