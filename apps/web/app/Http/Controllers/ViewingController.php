<?php

namespace App\Http\Controllers;

use DB;
use App\Models\Viewing;
use Illuminate\Http\Request;

class ViewingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    public function store(Request $r)
    {
        $data = $r->validate([
            'slot_id' => 'required|exists:viewing_slots,id',
            'name' => 'required|string|max:120',
            'phone' => 'required|string|max:40',
            'email' => 'nullable|email'
        ]);

        $slot = \App\Models\ViewingSlot::lockForUpdate()->findOrFail($data['slot_id']);
        abort_if($slot->booked >= $slot->capacity, 409, 'Slot full');

        $viewing = DB::transaction(function () use ($slot, $data) {
            $slot->increment('booked');
            return \App\Models\Viewing::create([
                'listing_id' => $slot->listing_id,
                'viewing_slot_id' => $slot->id,
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
            ]);
        });

        return response()->json($viewing, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Viewing $viewing)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Viewing $viewing)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Viewing $viewing)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Viewing $viewing)
    {
        //
    }
}
