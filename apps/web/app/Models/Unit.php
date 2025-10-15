<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Unit extends Model
{
    protected $fillable = [
        'building_id',
        'unit_type_id',
        'user_id',
        'group_id',
        'identifier',
        'slug',
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
    ];

    protected $casts = [
        'bedrooms'        => 'integer',
        'bathrooms'       => 'integer',
        'floor_area_sqm'  => 'integer',
        'floor_number'    => 'integer',
        'furnished'       => 'boolean',
        'pets_allowed'    => 'boolean',
        'smoking_allowed' => 'boolean',
        'rent'            => 'integer',
        'deposit'         => 'integer',
        'available_from'  => 'date',
        'min_lease_months'=> 'integer',
        'amenities'       => 'array',
        'policies'        => 'array',
        'extra_info'      => 'array',
        'is_active'       => 'boolean',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function unitType(): BelongsTo
    {
        return $this->belongsTo(UnitType::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function listings(): BelongsToMany
    {
        return $this->belongsToMany(Listing::class)
            ->withTimestamps()
            ->withPivot('display_order')
            ->orderByPivot('display_order');
    }

    public function primaryListing(): HasOne
    {
        return $this->hasOne(Listing::class);
    }
}
