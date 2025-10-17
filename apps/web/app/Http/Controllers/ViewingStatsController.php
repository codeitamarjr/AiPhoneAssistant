<?php

namespace App\Http\Controllers;

use App\Models\Viewing;
use Illuminate\Http\Request;

class ViewingStatsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $periodStart = now()->startOfMonth();
        $periodEnd = now();

        $groupId = null;
        if (method_exists($user, 'currentGroupId')) {
            $groupId = $user->currentGroupId();
        } elseif (property_exists($user, 'group_id') && $user->group_id) {
            $groupId = $user->group_id;
        }

        if (!$groupId) {
            return response()->json([
                'period' => [
                    'label' => $periodStart->format('F Y'),
                    'start' => $periodStart->toISOString(),
                    'end'   => $periodEnd->toISOString(),
                ],
                'viewings' => [
                    'total' => 0,
                    'scheduled' => 0,
                    'cancelled' => 0,
                ],
            ]);
        }

        $viewings = Viewing::query()
            ->whereHas('listing', fn ($listing) => $listing->where('group_id', $groupId))
            ->whereBetween('created_at', [$periodStart, $periodEnd])
            ->get();

        $total = $viewings->count();
        $scheduled = $viewings->filter(fn ($viewing) => $viewing->scheduled_at !== null)->count();
        $cancelled = max($total - $scheduled, 0);

        return response()->json([
            'period' => [
                'label' => $periodStart->format('F Y'),
                'start' => $periodStart->toISOString(),
                'end'   => $periodEnd->toISOString(),
            ],
            'viewings' => [
                'total' => $total,
                'scheduled' => $scheduled,
                'cancelled' => $cancelled,
            ],
        ]);
    }
}
