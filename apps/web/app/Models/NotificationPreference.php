<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    public const CHANNEL_LEADS = 'leads';
    public const CHANNEL_BOOKINGS = 'bookings';

    protected $fillable = [
        'user_id',
        'channel',
    ];

    public static function channels(): array
    {
        return [
            self::CHANNEL_LEADS => [
                'label' => 'New leads',
                'description' => 'Email me when a new lead is captured by the assistant.',
            ],
            self::CHANNEL_BOOKINGS => [
                'label' => 'New bookings',
                'description' => 'Email me when a new viewing is booked by the assistant.',
            ],
        ];
    }

    public static function validChannel(string $channel): bool
    {
        return array_key_exists($channel, self::channels());
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
