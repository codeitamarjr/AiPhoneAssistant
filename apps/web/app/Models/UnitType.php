<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnitType extends Model
{
    protected $fillable = [
        'building_id',
        'name',
        'description',
        'bedrooms',
        'bathrooms',
        'floor_area_min_sqm',
        'floor_area_max_sqm',
        'ber',
        'furnished',
        'pets_allowed',
        'smoking_allowed',
        'default_rent',
        'default_deposit',
        'min_lease_months',
        'quantity_total',
        'quantity_available',
        'amenities',
        'policies',
    ];

    protected $casts = [
        'bedrooms'            => 'integer',
        'bathrooms'           => 'integer',
        'floor_area_min_sqm'  => 'integer',
        'floor_area_max_sqm'  => 'integer',
        'furnished'           => 'boolean',
        'pets_allowed'        => 'boolean',
        'smoking_allowed'     => 'boolean',
        'default_rent'        => 'integer',
        'default_deposit'     => 'integer',
        'min_lease_months'    => 'integer',
        'quantity_total'      => 'integer',
        'quantity_available'  => 'integer',
        'amenities'           => 'array',
        'policies'            => 'array',
    ];

    public function building(): BelongsTo
    {
        return $this->belongsTo(Building::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }
}
