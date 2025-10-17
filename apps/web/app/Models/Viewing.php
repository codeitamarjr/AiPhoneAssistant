<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Viewing extends Model
{
    protected $fillable = [
        'listing_id',
        'viewing_slot_id',
        'name',
        'phone',
        'email',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function slot(): BelongsTo
    {
        return $this->belongsTo(ViewingSlot::class, 'viewing_slot_id');
    }
}
