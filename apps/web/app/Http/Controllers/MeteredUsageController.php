<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesPeriod;
use App\Models\CallLog;
use Illuminate\Http\Request;

class MeteredUsageController extends Controller
{
    use ResolvesPeriod;

    public function index(Request $request)
    {
        $user = $request->user();
        [$periodStart, $periodEnd, $label] = $this->resolvePeriod($request);

        $scoped = CallLog::query()
            ->when(method_exists($user, 'currentGroupId'), function ($qq) use ($user) {
                $qq->where('group_id', $user->currentGroupId());
            }, function ($qq) use ($user) {
                if (property_exists($user, 'group_id') && $user->group_id) {
                    $qq->where('group_id', $user->group_id);
                }
            })
            ->whereBetween('created_at', [$periodStart, $periodEnd]);

        $totalCalls = (clone $scoped)->count();
        $completedCalls = (clone $scoped)->where('status', 'completed')->count();
        $totalDurationSeconds = (int) ((clone $scoped)->sum('duration_seconds') ?? 0);
        $totalMeteredMinutes = (int) ((clone $scoped)->sum('metered_minutes') ?? 0);

        $daily = (clone $scoped)
            ->selectRaw('DATE(created_at) as usage_date')
            ->selectRaw('COUNT(*) as call_count')
            ->selectRaw('COALESCE(SUM(duration_seconds), 0) as duration_seconds')
            ->selectRaw('COALESCE(SUM(metered_minutes), 0) as metered_minutes')
            ->groupBy('usage_date')
            ->orderBy('usage_date')
            ->get()
            ->map(function ($row) {
                return [
                    'date' => $row->usage_date,
                    'calls' => (int) $row->call_count,
                    'duration_seconds' => (int) $row->duration_seconds,
                    'metered_minutes' => (int) $row->metered_minutes,
                ];
            });

        $runningMinutes = 0;
        $dailyWithRunningTotals = $daily->map(function (array $row) use (&$runningMinutes) {
            $runningMinutes += $row['metered_minutes'];
            $row['running_metered_minutes'] = $runningMinutes;

            return $row;
        });

        return response()->json([
            'period' => [
                'label' => $label,
                'start' => $periodStart->toIso8601String(),
                'end' => $periodEnd->toIso8601String(),
            ],
            'summary' => [
                'calls' => $totalCalls,
                'completed' => $completedCalls,
                'duration_seconds' => $totalDurationSeconds,
                'metered_minutes' => $totalMeteredMinutes,
                'average_metered_minutes_per_call' => $totalCalls > 0
                    ? round($totalMeteredMinutes / $totalCalls, 2)
                    : 0,
            ],
            'breakdown' => $dailyWithRunningTotals,
        ]);
    }
}
