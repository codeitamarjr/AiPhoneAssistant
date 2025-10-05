<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ListingFaq extends Model
{
    protected $fillable = ['listing_id', 'question', 'answer', 'weight'];
    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }
}
