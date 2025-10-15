<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Building extends Model
{
    protected $fillable = [
        'user_id',
        'group_id',
        'name',
        'slug',
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
    ];

    protected $casts = [
        'latitude'  => 'float',
        'longitude' => 'float',
        'amenities' => 'array',
        'policies'  => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    public function unitTypes(): HasMany
    {
        return $this->hasMany(UnitType::class);
    }
}
