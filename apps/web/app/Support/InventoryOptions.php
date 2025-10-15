<?php

namespace App\Support;

use App\Models\Building;
use App\Models\Unit;
use App\Models\UnitType;

class InventoryOptions
{
    public static function forGroup(?int $groupId): array
    {
        if (!$groupId) {
            return [
                'buildings' => [],
                'unitTypes' => [],
                'units' => [],
            ];
        }

        $buildings = Building::query()
            ->where('group_id', $groupId)
            ->orderByRaw("CASE WHEN name IS NULL OR name = '' THEN 1 ELSE 0 END")
            ->orderByRaw("COALESCE(NULLIF(name, ''), address_line1)")
            ->orderBy('id')
            ->get([
                'id',
                'name',
                'slug',
                'address_line1',
                'city',
                'county',
                'postcode',
                'parking',
                'heating',
                'amenities',
                'policies',
            ])
            ->map(function (Building $building) {
                return [
                    'id' => $building->id,
                    'name' => $building->name ?: ($building->address_line1 ?? 'Unnamed building'),
                    'address_line1' => $building->address_line1,
                    'city' => $building->city,
                    'county' => $building->county,
                    'postcode' => $building->postcode,
                    'parking' => $building->parking,
                    'heating' => $building->heating,
                    'amenities' => $building->amenities,
                    'policies' => $building->policies,
                ];
            })
            ->values();

        $units = Unit::query()
            ->with('building:id,name')
            ->where(function ($qq) use ($groupId) {
                $qq->where('group_id', $groupId)
                    ->orWhereHas('building', fn ($b) => $b->where('group_id', $groupId));
            })
            ->orderByRaw("CASE WHEN identifier IS NULL OR identifier = '' THEN 1 ELSE 0 END")
            ->orderBy('identifier')
            ->orderBy('id')
            ->get([
                'id',
                'identifier',
                'building_id',
                'bedrooms',
                'bathrooms',
                'floor_area_sqm',
                'rent',
                'deposit',
                'available_from',
                'min_lease_months',
                'pets_allowed',
                'smoking_allowed',
                'furnished',
                'parking',
                'heating',
                'is_active',
            ])
            ->map(function (Unit $unit) {
                return [
                    'id' => $unit->id,
                    'identifier' => $unit->identifier ?: "Unit {$unit->id}",
                    'bedrooms' => $unit->bedrooms,
                    'bathrooms' => $unit->bathrooms,
                    'floor_area_sqm' => $unit->floor_area_sqm,
                    'rent' => $unit->rent,
                    'deposit' => $unit->deposit,
                    'available_from' => optional($unit->available_from)?->toDateString(),
                    'min_lease_months' => $unit->min_lease_months,
                    'pets_allowed' => $unit->pets_allowed,
                    'smoking_allowed' => $unit->smoking_allowed,
                    'furnished' => $unit->furnished,
                    'parking' => $unit->parking,
                    'heating' => $unit->heating,
                    'is_active' => (bool) $unit->is_active,
                    'building' => $unit->building ? [
                        'id' => $unit->building->id,
                        'name' => $unit->building->name ?? 'Building',
                    ] : null,
                ];
            })
            ->values();

        $unitTypes = UnitType::query()
            ->with('building:id,name')
            ->whereHas('building', fn ($b) => $b->where('group_id', $groupId))
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'description',
                'building_id',
                'bedrooms',
                'bathrooms',
                'floor_area_min_sqm',
                'floor_area_max_sqm',
                'default_rent',
                'default_deposit',
                'min_lease_months',
                'quantity_available',
                'quantity_total',
                'amenities',
                'policies',
            ])
            ->map(function (UnitType $unitType) {
                return [
                    'id' => $unitType->id,
                    'name' => $unitType->name,
                    'description' => $unitType->description,
                    'bedrooms' => $unitType->bedrooms,
                    'bathrooms' => $unitType->bathrooms,
                    'floor_area_min_sqm' => $unitType->floor_area_min_sqm,
                    'floor_area_max_sqm' => $unitType->floor_area_max_sqm,
                    'default_rent' => $unitType->default_rent,
                    'default_deposit' => $unitType->default_deposit,
                    'min_lease_months' => $unitType->min_lease_months,
                    'quantity_available' => $unitType->quantity_available,
                    'quantity_total' => $unitType->quantity_total,
                    'amenities' => $unitType->amenities,
                    'policies' => $unitType->policies,
                    'building' => $unitType->building ? [
                        'id' => $unitType->building->id,
                        'name' => $unitType->building->name ?? 'Building',
                    ] : null,
                ];
            })
            ->values();

        return [
            'buildings' => $buildings,
            'unitTypes' => $unitTypes,
            'units' => $units,
        ];
    }
}
