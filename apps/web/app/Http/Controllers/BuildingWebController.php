<?php

namespace App\Http\Controllers;

use App\Models\Building;
use App\Support\InventoryOptions;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BuildingWebController extends Controller
{
    public function index(Request $request)
    {
        $groupId = $this->currentGroupId(true);

        $buildings = Building::query()
            ->withCount(['units', 'unitTypes'])
            ->where('group_id', $groupId)
            ->orderByRaw("CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END")
            ->orderByRaw("COALESCE(NULLIF(name, ''), address_line1)")
            ->orderBy('id')
            ->get()
            ->map(function (Building $building) {
                return [
                    'id' => $building->id,
                    'name' => $building->name ?: ($building->address_line1 ?? 'Building'),
                    'address_line1' => $building->address_line1,
                    'city' => $building->city,
                    'county' => $building->county,
                    'postcode' => $building->postcode,
                    'units_count' => $building->units_count,
                    'unit_types_count' => $building->unit_types_count,
                ];
            });

        return Inertia::render('Inventory/Buildings/index', [
            'buildings' => $buildings,
        ]);
    }

    public function create()
    {
        $this->ensureGroupSelected();

        return Inertia::render('Inventory/Buildings/create', [
            'defaults' => [
                'name' => '',
                'address_line1' => '',
                'address_line2' => '',
                'city' => '',
                'county' => '',
                'postcode' => '',
                'parking' => '',
                'heating' => '',
                'amenities' => null,
                'policies' => null,
                'notes' => '',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $groupId = $this->currentGroupId(true);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:190'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'county' => ['nullable', 'string', 'max:120'],
            'postcode' => ['nullable', 'string', 'max:16'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'parking' => ['nullable', 'string', 'max:120'],
            'heating' => ['nullable', 'string', 'max:120'],
            'amenities' => ['nullable'],
            'policies' => ['nullable'],
            'notes' => ['nullable', 'string'],
        ]);

        $data = $this->preparePayload($request, $data);

        $data['group_id'] = $groupId;
        $data['user_id'] = $request->user()->id;

        $building = Building::create($data);

        return redirect()->route('inventory.buildings.edit', $building)->with('success', 'Building created');
    }

    public function edit(Building $building)
    {
        $this->authorizeBuilding($building);

        $payload = $building->only([
            'id',
            'name',
            'address_line1',
            'address_line2',
            'city',
            'county',
            'postcode',
            'latitude',
            'longitude',
            'parking',
            'heating',
            'amenities',
            'policies',
            'notes',
        ]);

        return Inertia::render('Inventory/Buildings/edit', [
            'building' => $payload,
            'inventory' => InventoryOptions::forGroup($building->group_id),
        ]);
    }

    public function update(Request $request, Building $building)
    {
        $this->authorizeBuilding($building);

        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:190'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'county' => ['nullable', 'string', 'max:120'],
            'postcode' => ['nullable', 'string', 'max:16'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'parking' => ['nullable', 'string', 'max:120'],
            'heating' => ['nullable', 'string', 'max:120'],
            'amenities' => ['nullable'],
            'policies' => ['nullable'],
            'notes' => ['nullable', 'string'],
        ]);

        $data = $this->preparePayload($request, $data);

        $building->update($data);

        return back()->with('success', 'Building updated');
    }

    public function destroy(Building $building)
    {
        $this->authorizeBuilding($building);

        if ($building->units()->exists()) {
            throw ValidationException::withMessages([
                'building' => 'Remove or reassign units before deleting this building.',
            ]);
        }

        $building->delete();

        return redirect()->route('inventory.buildings.index')->with('success', 'Building deleted');
    }

    private function preparePayload(Request $request, array $data): array
    {
        foreach (['amenities', 'policies'] as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $value = $data[$key];
            if (is_string($value)) {
                $value = trim($value);
                if ($value === '') {
                    $data[$key] = null;
                    continue;
                }
                $decoded = json_decode($value, true);
                $data[$key] = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
            } elseif (!is_array($value)) {
                $data[$key] = null;
            }
        }

        foreach (['latitude', 'longitude'] as $numeric) {
            if (array_key_exists($numeric, $data) && $data[$numeric] === '') {
                $data[$numeric] = null;
            }
        }

        foreach (['address_line2', 'city', 'county', 'postcode', 'parking', 'heating', 'notes'] as $scalar) {
            if (array_key_exists($scalar, $data) && $data[$scalar] === '') {
                $data[$scalar] = null;
            }
        }

        return $data;
    }

    private function authorizeBuilding(Building $building): void
    {
        $groupId = $this->currentGroupId(true);
        abort_unless($building->group_id === $groupId, 403, 'Forbidden');
    }

    private function ensureGroupSelected(): void
    {
        $this->currentGroupId(true);
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
