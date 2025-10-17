<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ViewingSlot extends Model
{
    protected $fillable = [
        'listing_id',
        'start_at',
        'capacity',
    ];

    protected $casts = [
        'start_at' => 'datetime',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function viewings(): HasMany
    {
        return $this->hasMany(Viewing::class);
    }
}
