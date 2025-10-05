<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Listing extends Model
{
    protected $fillable = [
        'user_id',
        'group_id',
        'title',
        'address',
        'eircode',
        'summary',
        'monthly_rent_eur',
        'deposit_eur',
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
        'monthly_rent_eur'  => 'integer',
        'deposit_eur'       => 'integer',
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

    public function group()
    {
        return $this->belongsTo(\App\Models\Group::class);
    }
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function faqs()
    {
        return $this->hasMany(\App\Models\ListingFaq::class);
    }
    public function viewingSlots()
    {
        return $this->hasMany(\App\Models\ViewingSlot::class);
    }
    public function phoneNumber()
    {
        return $this->hasOne(PhoneNumber::class);
    }
}
