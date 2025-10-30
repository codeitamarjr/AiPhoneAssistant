<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Listing extends Model
{
    public const SCOPE_LEGACY = 'legacy';
    public const SCOPE_SINGLE_UNIT = 'unit';
    public const SCOPE_UNIT_TYPE = 'unit_type';
    public const SCOPE_COLLECTION = 'collection';

    protected $fillable = [
        'user_id',
        'group_id',
        'inventory_scope',
        'unit_id',
        'unit_type_id',
        'title',
        'address',
        'postcode',
        'summary',
        'escalation_contact_name',
        'escalation_contact_phone',
        'rent',
        'deposit',
        'available_from',
        'min_lease_months',
        'bedrooms',
        'bathrooms',
        'floor_area_sqm',
        'floor_number',
        'ber',
        'furnished',
        'pets_allowed',
        'smoking_allowed',
        'parking',
        'heating',
        'amenities',
        'policies',
        'extra_info',
        'main_photo_path',
        'is_current',
        'is_published',
    ];

    protected $casts = [
        'available_from'    => 'date',
        'rent'              => 'integer',
        'deposit'           => 'integer',
        'min_lease_months'  => 'integer',
        'bedrooms'          => 'integer',
        'bathrooms'         => 'integer',
        'floor_area_sqm'    => 'integer',
        'floor_number'      => 'integer',
        'furnished'         => 'boolean',
        'pets_allowed'      => 'boolean',
        'smoking_allowed'   => 'boolean',
        'amenities'         => 'array',
        'policies'          => 'array',
        'extra_info'        => 'array',
        'is_current'        => 'boolean',
        'is_published'      => 'boolean',
    ];

    /**
     * Cache resolved inventory relations to avoid duplicate lookups while
     * computing fallbacks for derived attributes.
     */
    protected array $inventoryRelationCache = [];

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function unitType(): BelongsTo
    {
        return $this->belongsTo(UnitType::class);
    }

    public function advertisedUnits(): BelongsToMany
    {
        return $this->belongsToMany(Unit::class)
            ->withTimestamps()
            ->withPivot('display_order')
            ->orderByPivot('display_order');
    }

    public function faqs(): HasMany
    {
        return $this->hasMany(ListingFaq::class);
    }

    public function viewingSlots(): HasMany
    {
        return $this->hasMany(ViewingSlot::class);
    }

    public function phoneNumber(): HasOne
    {
        return $this->hasOne(PhoneNumber::class);
    }

    public function getInventoryScopeAttribute($value): ?string
    {
        if ($value !== null) {
            return $value;
        }

        if ($this->unit_id) {
            return self::SCOPE_SINGLE_UNIT;
        }

        if ($this->unit_type_id) {
            return self::SCOPE_UNIT_TYPE;
        }

        if ($this->relationLoaded('advertisedUnits')) {
            return $this->advertisedUnits->isEmpty() ? self::SCOPE_LEGACY : self::SCOPE_COLLECTION;
        }

        return $this->advertisedUnits()->exists()
            ? self::SCOPE_COLLECTION
            : self::SCOPE_LEGACY;
    }

    public function getAddressAttribute($value): ?string
    {
        if ($value !== null) {
            return $value;
        }

        $unit = $this->resolveUnit();
        if ($unit && $unit->address_line1) {
            return $unit->address_line1;
        }

        $building = $this->resolveBuilding();

        return $building?->address_line1;
    }

    public function getPostcodeAttribute($value): ?string
    {
        $resolved = $this->inventoryAttribute('postcode', $value, null, 'postcode');

        if ($resolved === null && array_key_exists('postcode', $this->attributes ?? [])) {
            return $this->attributes['postcode'];
        }

        return $resolved;
    }

    public function setPostcodeAttribute($value): void
    {
        $this->attributes['postcode'] = $value;

        if (array_key_exists('postcode', $this->attributes ?? [])) {
            $this->attributes['postcode'] = $value;
        }
    }

    public function getRentAttribute($value): ?int
    {
        return $this->inventoryAttribute('rent', $value, fn (UnitType $type) => $type->default_rent);
    }

    public function getDepositAttribute($value): ?int
    {
        return $this->inventoryAttribute('deposit', $value, fn (UnitType $type) => $type->default_deposit);
    }

    public function getAvailableFromAttribute($value)
    {
        return $this->inventoryAttribute('available_from', $value);
    }

    public function getMinLeaseMonthsAttribute($value): ?int
    {
        return $this->inventoryAttribute('min_lease_months', $value, fn (UnitType $type) => $type->min_lease_months);
    }

    public function getBedroomsAttribute($value): ?int
    {
        return $this->inventoryAttribute('bedrooms', $value);
    }

    public function getBathroomsAttribute($value): ?int
    {
        return $this->inventoryAttribute('bathrooms', $value);
    }

    public function getFloorAreaSqmAttribute($value): ?int
    {
        return $this->inventoryAttribute(
            'floor_area_sqm',
            $value,
            fn (UnitType $type) => $this->resolveFloorAreaFromUnitType($type)
        );
    }

    public function getFloorNumberAttribute($value): ?int
    {
        return $this->inventoryAttribute('floor_number', $value);
    }

    public function getBerAttribute($value): ?string
    {
        return $this->inventoryAttribute('ber', $value);
    }

    public function getFurnishedAttribute($value): ?bool
    {
        return $this->inventoryAttribute('furnished', $value, null, null, true);
    }

    public function getPetsAllowedAttribute($value): ?bool
    {
        return $this->inventoryAttribute('pets_allowed', $value, null, null, true);
    }

    public function getSmokingAllowedAttribute($value): ?bool
    {
        return $this->inventoryAttribute('smoking_allowed', $value, null, null, true);
    }

    public function getParkingAttribute($value): ?string
    {
        return $this->inventoryAttribute('parking', $value, null, 'parking');
    }

    public function getHeatingAttribute($value): ?string
    {
        return $this->inventoryAttribute('heating', $value, null, 'heating');
    }

    public function getAmenitiesAttribute($value): ?array
    {
        $resolved = $this->inventoryAttribute('amenities', $value, null, 'amenities');

        return $this->normalizeJsonArray($resolved);
    }

    public function getPoliciesAttribute($value): ?array
    {
        $resolved = $this->inventoryAttribute('policies', $value, null, 'policies');

        return $this->normalizeJsonArray($resolved);
    }

    public function getExtraInfoAttribute($value): ?array
    {
        $resolved = $this->inventoryAttribute('extra_info', $value);

        return $this->normalizeJsonArray($resolved);
    }

    protected function inventoryAttribute(
        string $attribute,
        $value = null,
        ?callable $unitTypeResolver = null,
        ?string $buildingAttribute = null,
        bool $isBoolean = false
    ) {
        if (!$this->isNullish($value, $isBoolean)) {
            return $value;
        }

        $unit = $this->resolveUnit();
        if ($unit && !$this->isNullish($unit->{$attribute} ?? null, $isBoolean)) {
            return $unit->{$attribute};
        }

        $unitType = $this->resolveUnitType();
        if ($unitType) {
            if ($unitTypeResolver) {
                $resolved = $unitTypeResolver($unitType);
                if (!$this->isNullish($resolved, $isBoolean)) {
                    return $resolved;
                }
            } elseif (!$this->isNullish($unitType->{$attribute} ?? null, $isBoolean)) {
                return $unitType->{$attribute};
            }
        }

        if ($buildingAttribute) {
            $building = $this->resolveBuilding();
            if ($building && !$this->isNullish($building->{$buildingAttribute} ?? null, $isBoolean)) {
                return $building->{$buildingAttribute};
            }
        }

        return $value;
    }

    protected function resolveFloorAreaFromUnitType(UnitType $unitType): ?int
    {
        $min = $unitType->floor_area_min_sqm;
        $max = $unitType->floor_area_max_sqm;

        if ($min === null && $max === null) {
            return null;
        }

        if ($min !== null && $max !== null) {
            return (int) round(($min + $max) / 2);
        }

        return $min ?? $max;
    }

    protected function resolveUnit(): ?Unit
    {
        if (array_key_exists('unit', $this->inventoryRelationCache)) {
            $cached = $this->inventoryRelationCache['unit'];

            if (($cached && $cached->getKey() === $this->unit_id) || ($cached === null && $this->unit_id === null)) {
                return $cached;
            }
        }

        $unit = $this->getRelationValue('unit');

        if ($unit && $unit->getKey() !== $this->unit_id) {
            $unit = null;
        }

        if (!$unit && $this->unit_id) {
            $unit = $this->unit()->with('building')->first();
        }

        return $this->inventoryRelationCache['unit'] = $unit;
    }

    protected function resolveUnitType(): ?UnitType
    {
        if (array_key_exists('unitType', $this->inventoryRelationCache)) {
            $cached = $this->inventoryRelationCache['unitType'];

            if (($cached && $cached->getKey() === $this->unit_type_id) || ($cached === null && $this->unit_type_id === null)) {
                return $cached;
            }
        }

        $unitType = $this->getRelationValue('unitType');

        if ($unitType && $unitType->getKey() !== $this->unit_type_id) {
            $unitType = null;
        }

        if (!$unitType && $this->unit_type_id) {
            $unitType = $this->unitType()->with('building')->first();
        }

        return $this->inventoryRelationCache['unitType'] = $unitType;
    }

    protected function resolveBuilding(): ?Building
    {
        if (array_key_exists('building', $this->inventoryRelationCache)) {
            $cached = $this->inventoryRelationCache['building'];
            $unit = $this->resolveUnit();
            $unitType = $this->resolveUnitType();

            $expectedId = $unit?->building_id ?? $unitType?->building_id;
            if (($cached && $cached->getKey() === $expectedId) || ($cached === null && $expectedId === null)) {
                return $cached;
            }
        }

        $building = null;

        $unit = $this->resolveUnit();
        if ($unit) {
            $building = $unit->getRelationValue('building');
            if (!$building && $unit->building_id) {
                $building = $unit->building()->first();
            }
        }

        if (!$building) {
            $unitType = $this->resolveUnitType();
            if ($unitType) {
                $building = $unitType->getRelationValue('building');
                if (!$building && $unitType->building_id) {
                    $building = $unitType->building()->first();
                }
            }
        }

        return $this->inventoryRelationCache['building'] = $building;
    }

    protected function isNullish($value, bool $isBoolean): bool
    {
        if ($isBoolean) {
            return $value === null;
        }

        return $value === null;
    }

    protected function normalizeJsonArray($value): ?array
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            return $value;
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }

            $trimmed = trim($value);
            if ($trimmed === '') {
                return null;
            }

            if (str_contains($trimmed, ',')) {
                return array_values(
                    array_filter(
                        array_map(static fn ($item) => trim($item), explode(',', $trimmed)),
                        static fn ($item) => $item !== ''
                    )
                );
            }

            return [$trimmed];
        }

        return (array) $value;
    }
}
