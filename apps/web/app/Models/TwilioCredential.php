<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TwilioCredential extends Model
{
    protected $fillable = [
        'group_id',
        'account_sid',
        'subaccount_sid',
        'incoming_phone_sid',
        'incoming_phone_e164',
        'is_active'
    ];
    protected $casts = ['is_active' => 'boolean'];
}
