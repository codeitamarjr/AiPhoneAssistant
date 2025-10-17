<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ViewingSlot extends Model
{
    public const MODE_OPEN = 'open';
    public const MODE_STAGGERED = 'staggered';

    protected $fillable = [
        'listing_id',
        'start_at',
        'capacity',
        'mode',
        'slot_interval_minutes',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'slot_interval_minutes' => 'integer',
    ];

    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    public function viewings(): HasMany
    {
        return $this->hasMany(Viewing::class);
    }

    public function isStaggered(): bool
    {
        return $this->mode === self::MODE_STAGGERED;
    }
}
