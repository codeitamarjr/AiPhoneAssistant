<?php

namespace App\Http\Controllers;

use App\Models\Viewing;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ResolvesPeriod;

class ViewingStatsController extends Controller
{
    use ResolvesPeriod;

    public function index(Request $request)
    {
        $user = $request->user();
        [$periodStart, $periodEnd, $label] = $this->resolvePeriod($request);

        $groupId = null;
        if (method_exists($user, 'currentGroupId')) {
            $groupId = $user->currentGroupId();
        } elseif (property_exists($user, 'group_id') && $user->group_id) {
            $groupId = $user->group_id;
        }

        if (!$groupId) {
            return response()->json([
                'period' => [
                    'label' => $label,
                    'start' => $periodStart->toIso8601String(),
                    'end'   => $periodEnd->toIso8601String(),
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
                'label' => $label,
                'start' => $periodStart->toIso8601String(),
                'end'   => $periodEnd->toIso8601String(),
            ],
            'viewings' => [
                'total' => $total,
                'scheduled' => $scheduled,
                'cancelled' => $cancelled,
            ],
        ]);
    }
}
