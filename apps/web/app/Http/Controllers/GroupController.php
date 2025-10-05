<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Group;
use App\Models\Membership;
use Illuminate\Http\Request;
use App\Http\Requests\StoreGroupRequest;

class GroupController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    public function store(StoreGroupRequest $req)
    {
        $group = Group::create([
            'name' => $req->name,
            'owner_id' => auth()->id(),
        ]);
        Membership::create(['group_id' => $group->id, 'user_id' => auth()->id(), 'role' => 'owner']);
        return response()->json($group, 201);
    }

    public function show(Request $req, Group $group)
    {
        $this->authorize('view', $group);
        return Inertia::render('Groups/Show', [
            'group' => $group->load('twilioCredential'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
