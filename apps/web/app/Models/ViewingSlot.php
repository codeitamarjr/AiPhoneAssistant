<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

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

    public function refreshSchedule(): void
    {
        $viewings = $this->viewings()
            ->orderBy('created_at')
            ->get();

        if ($viewings->isEmpty()) {
            return;
        }

        if ($this->isStaggered() && $this->slot_interval_minutes) {
            $start = $this->start_at instanceof Carbon
                ? $this->start_at->copy()
                : ($this->start_at ? Carbon::parse($this->start_at) : null);

            if (!$start) {
                foreach ($viewings as $viewing) {
                    if ($viewing->scheduled_at !== null) {
                        $viewing->forceFill(['scheduled_at' => null])->saveQuietly();
                    }
                }

                return;
            }

            foreach ($viewings as $index => $viewing) {
                $scheduled = $start->copy()->addMinutes($this->slot_interval_minutes * $index);

                if (!$viewing->scheduled_at || !$viewing->scheduled_at->equalTo($scheduled)) {
                    $viewing->forceFill(['scheduled_at' => $scheduled])->saveQuietly();
                }
            }
        } else {
            foreach ($viewings as $viewing) {
                if ($viewing->scheduled_at !== null) {
                    $viewing->forceFill(['scheduled_at' => null])->saveQuietly();
                }
            }
        }
    }
}
