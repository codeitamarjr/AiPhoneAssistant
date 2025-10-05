<?php

namespace App\Http\Controllers;

use App\Models\ViewingSlot;
use Illuminate\Http\Request;

class ViewingSlotController extends Controller
{
    public function index()
    {
        $slots = \App\Models\ViewingSlot::with('listing')
            ->whereHas('listing', fn($q) => $q->where('is_current', true))
            ->where('start_at', '>=', now())
            ->orderBy('start_at')->get();
        return response()->json($slots);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ViewingSlot $viewingSlot)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ViewingSlot $viewingSlot)
    {
        //
    }
}
