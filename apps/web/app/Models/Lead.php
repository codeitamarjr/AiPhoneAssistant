<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
      'group_id','listing_id','caller_id','call_log_id','name','phone_e164',
      'email','source','status','notes'
    ];
    public function listing(){ return $this->belongsTo(Listing::class); }
    public function caller(){ return $this->belongsTo(Caller::class); }
    public function callLog(){ return $this->belongsTo(CallLog::class); }
    public function group(){ return $this->belongsTo(Group::class); }
}
