<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\GroupInvitation;

class Group extends Model
{
    protected $fillable = ['name', 'owner_id'];
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
    public function members()
    {
        return $this->belongsToMany(User::class, 'memberships');
    }
    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }
    public function invitations()
    {
        return $this->hasMany(GroupInvitation::class);
    }
    public function twilioCredential()
    {
        return $this->hasOne(TwilioCredential::class);
    }
    public function phoneNumbers()
    {
        return $this->hasMany(PhoneNumber::class);
    }
}
