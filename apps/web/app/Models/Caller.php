<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Caller extends Model
{
    protected $fillable = ['group_id', 'phone_e164', 'name', 'email', 'meta'];
    protected $casts = ['meta' => 'array'];
}
