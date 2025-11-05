<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CallLog extends Model
{
    protected $fillable = [
        'group_id',
        'twilio_call_sid',
        'from_e164',
        'to_e164',
        'caller_name',
        'status',
        'started_at',
        'ended_at',
        'duration_seconds',
        'metered_minutes',
        'meta'
    ];
    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
        'meta'       => 'array',
        'metered_minutes' => 'integer',
    ];

    public function group()
    {
        return $this->belongsTo(Group::class);
    }
}
