<?php

namespace App\Models;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Database\Eloquent\Model;

class TwilioCredential extends Model
{
    protected $fillable = [
        'group_id',
        'account_sid',
        'auth_token_encrypted',
        'subaccount_sid',
        'incoming_phone_sid',
        'incoming_phone_e164',
        'is_active'
    ];
    protected $casts = ['is_active' => 'boolean'];

    // helpers
    public static function fromPlainToken(int $groupId, string $accountSid, string $authToken): self
    {
        return new self([
            'group_id' => $groupId,
            'account_sid' => $accountSid,
            'auth_token_encrypted' => Crypt::encryptString($authToken),
        ]);
    }
    public function authToken(): string
    {
        return Crypt::decryptString($this->auth_token_encrypted);
    }
}
