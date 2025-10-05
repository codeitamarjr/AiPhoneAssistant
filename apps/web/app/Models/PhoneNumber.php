<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneNumber extends Model
{
    protected $fillable = [
        'group_id',
        'user_id',
        'sid',
        'phone_number',
        'friendly_name',
        'country_code',
        'capabilities',
        'is_active',
        'is_connected',
        'listing_id',
        'meta',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_connected' => 'boolean',
        'meta' => 'array',
    ];

    // Relationships
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }
}
