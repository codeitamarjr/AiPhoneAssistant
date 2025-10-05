<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    /** Groups the user owns */
    public function ownedGroups()
    {
        return $this->hasMany(Group::class, 'owner_id');
    }

    /** Groups the user is member of (including owned if you also create a membership row for owner) */
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'memberships')
            ->withPivot('role')
            ->withTimestamps();
    }

    /** Membership rows */
    public function memberships()
    {
        return $this->hasMany(Membership::class);
    }

    /**
     * Resolve the current/active group id.
     * Priority: session('current_group_id') if valid -> first owned group -> first membership -> null
     */
    public function currentGroupId(): ?int
    {
        $sessionId = session('current_group_id');

        if ($sessionId) {
            // Ensure the user actually belongs to this group
            $belongs = $this->ownedGroups()->whereKey($sessionId)->exists()
                || $this->groups()->where('groups.id', $sessionId)->exists();

            if ($belongs) {
                return (int) $sessionId;
            } else {
                // Clean bad session value
                session()->forget('current_group_id');
            }
        }

        // Fallbacks
        $owned = $this->ownedGroups()->value('id');
        if ($owned) {
            session(['current_group_id' => $owned]);
            return (int) $owned;
        }

        $member = $this->groups()->value('groups.id');
        if ($member) {
            session(['current_group_id' => $member]);
            return (int) $member;
        }

        return null;
    }

    /** Convenience accessor: $user->currentGroup */
    public function getCurrentGroupAttribute(): ?Group
    {
        $id = $this->currentGroupId();
        return $id ? Group::find($id) : null;
    }

    /** Set/switch the active group id (validates membership) */
    public function setCurrentGroupId(int $groupId): bool
    {
        $belongs = $this->ownedGroups()->whereKey($groupId)->exists()
            || $this->groups()->where('groups.id', $groupId)->exists();

        if ($belongs) {
            session(['current_group_id' => $groupId]);
            return true;
        }
        return false;
    }
}
