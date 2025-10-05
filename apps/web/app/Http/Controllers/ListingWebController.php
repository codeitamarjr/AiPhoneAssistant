<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Listing;
use Illuminate\Http\Request;

class ListingWebController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $gid  = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;

        // Whitelist sortable columns to avoid bad input / SQL errors
        $sortable = [
            'created_at','title','address','eircode',
            'monthly_rent_eur','available_from','bedrooms','bathrooms',
        ];

        $search = trim((string) $request->get('search', ''));
        $sort   = in_array($request->get('sort', 'created_at'), $sortable, true)
            ? $request->get('sort', 'created_at')
            : 'created_at';
        $order  = $request->get('order', 'desc') === 'asc' ? 'asc' : 'desc';
        $per    = (int) ($request->get('per') ?? 10);

        $q = Listing::query()
            ->when($gid, fn($qq) => $qq->where('group_id', $gid))
            ->when($search, function ($qq) use ($search) {
                $qq->where(function ($w) use ($search) {
                    $w->where('title', 'like', "%{$search}%")
                      ->orWhere('address', 'like', "%{$search}%")
                      ->orWhere('eircode', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $order);

        $listings = $q->paginate($per)->appends($request->only('search', 'sort', 'order', 'per'));

        return Inertia::render('Listings/index', [
            'listings' => $listings,
            'filters'  => compact('search','sort','order','per'),
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Listings/create', [
            'defaults' => [
                'available_from' => now()->toDateString(),
                'furnished'      => true,
                'is_current'     => true,
                'is_published'   => false,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $gid = method_exists($request->user(), 'currentGroupId')
            ? $request->user()->currentGroupId()
            : null;

        abort_if(!$gid, 422, 'No active group. Please create or switch to a group.');

        $data = $request->validate([
            // Basic
            'title'            => ['required', 'string', 'max:190'],
            'address'          => ['required', 'string', 'max:255'], // made required
            'eircode'          => ['nullable', 'string', 'max:16'],
            'summary'          => ['nullable', 'string'],

            // Pricing & lease
            'monthly_rent_eur' => ['required', 'integer', 'min:0'],
            'deposit_eur'      => ['nullable', 'integer', 'min:0'],
            'available_from'   => ['required', 'date'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],

            // Property details
            'bedrooms'         => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms'        => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_sqm'   => ['nullable', 'integer', 'min:0'],
            'floor_number'     => ['nullable', 'integer'],
            'ber'              => ['nullable', 'string', 'max:10'],

            // Features
            'furnished'        => ['sometimes', 'boolean'],
            'pets_allowed'     => ['sometimes', 'boolean'],
            'smoking_allowed'  => ['sometimes', 'boolean'],
            'parking'          => ['nullable', 'string', 'max:100'],
            'heating'          => ['nullable', 'string', 'max:100'],

            // AI/meta (allow string or array)
            'amenities'        => ['nullable'],
            'policies'         => ['nullable'],
            'extra_info'       => ['nullable'],

            // Media & status
            'main_photo_path'  => ['nullable', 'string', 'max:255'],
            'is_current'       => ['sometimes', 'boolean'],
            'is_published'     => ['sometimes', 'boolean'],
        ]);

        // Accept either JSON string or object
        foreach (['amenities','policies','extra_info'] as $j) {
            if (isset($data[$j])) {
                if (is_string($data[$j]) && $data[$j] !== '') {
                    $decoded = json_decode($data[$j], true);
                    $data[$j] = $decoded ?? null;
                } elseif (!is_array($data[$j])) {
                    $data[$j] = null;
                }
            }
        }

        // Booleans
        foreach (['furnished','pets_allowed','smoking_allowed','is_current','is_published'] as $b) {
            $data[$b] = $request->boolean($b);
        }

        // Tenant context
        $data['group_id'] = $gid;
        $data['user_id']  = $request->user()->id;

        $listing = Listing::create($data);

        return redirect()->route('listings.edit', $listing)->with('success', 'Listing created');
    }

    public function edit(Listing $listing)
    {
        $this->authorizeListing($listing);

        // Ensure date is formatted for <input type="date">
        $payload = $listing->only([
            'id',
            // Basic
            'title','address','eircode','summary',
            // Pricing & lease
            'monthly_rent_eur','deposit_eur','min_lease_months',
            // Property details
            'bedrooms','bathrooms','floor_area_sqm','floor_number','ber',
            // Features
            'furnished','pets_allowed','smoking_allowed','parking','heating',
            // AI/meta
            'amenities','policies','extra_info',
            // Media & status
            'main_photo_path','is_current','is_published',
        ]);

        $payload['available_from'] = optional($listing->available_from)->format('Y-m-d');

        return Inertia::render('Listings/edit', [
            'listing' => $payload,
        ]);
    }

    public function update(Request $request, Listing $listing)
    {
        $this->authorizeListing($listing);

        $data = $request->validate([
            // Basic
            'title'            => ['required', 'string', 'max:190'],
            'address'          => ['required', 'string', 'max:255'], // required to match schema
            'eircode'          => ['nullable', 'string', 'max:16'],
            'summary'          => ['nullable', 'string'],

            // Pricing & lease
            'monthly_rent_eur' => ['required', 'integer', 'min:0'],
            'deposit_eur'      => ['nullable', 'integer', 'min:0'],
            'available_from'   => ['required', 'date'],
            'min_lease_months' => ['nullable', 'integer', 'min:1'],

            // Property details
            'bedrooms'         => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms'        => ['nullable', 'integer', 'min:0', 'max:20'],
            'floor_area_sqm'   => ['nullable', 'integer', 'min:0'],
            'floor_number'     => ['nullable', 'integer'],
            'ber'              => ['nullable', 'string', 'max:10'],

            // Features
            'furnished'        => ['sometimes', 'boolean'],
            'pets_allowed'     => ['sometimes', 'boolean'],
            'smoking_allowed'  => ['sometimes', 'boolean'],
            'parking'          => ['nullable', 'string', 'max:100'],
            'heating'          => ['nullable', 'string', 'max:100'],

            // AI/meta
            'amenities'        => ['nullable'],
            'policies'         => ['nullable'],
            'extra_info'       => ['nullable'],

            // Media & status
            'main_photo_path'  => ['nullable', 'string', 'max:255'],
            'is_current'       => ['sometimes', 'boolean'],
            'is_published'     => ['sometimes', 'boolean'],
        ]);

        foreach (['amenities','policies','extra_info'] as $j) {
            if (isset($data[$j])) {
                if (is_string($data[$j]) && $data[$j] !== '') {
                    $decoded = json_decode($data[$j], true);
                    $data[$j] = $decoded ?? null;
                } elseif (!is_array($data[$j])) {
                    $data[$j] = null;
                }
            }
        }

        foreach (['furnished','pets_allowed','smoking_allowed','is_current','is_published'] as $b) {
            if ($request->has($b)) {
                $data[$b] = $request->boolean($b);
            }
        }

        $listing->update($data);

        return back()->with('success', 'Listing updated');
    }

    public function destroy(Request $request, Listing $listing)
    {
        $this->authorizeListing($listing);
        $listing->delete();

        return redirect()->route('listings.index')->with('success', 'Listing deleted');
    }

    private function authorizeListing(Listing $listing): void
    {
        $user = auth()->user();
        $gid = method_exists($user, 'currentGroupId') ? $user->currentGroupId() : null;
        abort_unless($gid && $listing->group_id === $gid, 403, 'Forbidden');
    }
}
