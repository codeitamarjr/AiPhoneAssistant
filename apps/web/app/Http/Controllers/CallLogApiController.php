<?php

namespace App\Http\Controllers;

use App\Models\CallLog;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ResolvesPeriod;

class CallLogApiController extends Controller
{
    use ResolvesPeriod;

    public function stats(Request $request)
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

        return response()->json([
            'period' => [
                'label' => $label,
                'start' => $periodStart->toIso8601String(),
                'end'   => $periodEnd->toIso8601String(),
            ],
            'calls' => [
                'total' => $totalCalls,
                'completed' => $completedCalls,
                'duration_seconds' => $totalDurationSeconds,
                'metered_minutes' => $totalMeteredMinutes,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'search' => ['nullable','string','max:100'],
            'status' => ['nullable','in:in-progress,completed,failed,busy,no-answer,canceled'],
            'sort'   => ['nullable','in:started_at,ended_at,from_e164,to_e164,status,duration_seconds'],
            'order'  => ['nullable','in:asc,desc'],
            'page'   => ['nullable','integer','min:1'],
            'per'    => ['nullable','integer','min:5','max:100'],
        ]);

        $sort  = $validated['sort']  ?? 'started_at';
        $order = $validated['order'] ?? 'desc';
        $per   = $validated['per']   ?? 10;

        $q = CallLog::query()
            ->when(method_exists($user, 'currentGroupId'), function ($qq) use ($user) {
                $qq->where('group_id', $user->currentGroupId());
            }, function ($qq) use ($user) {
                // fallback: if you store group on user, or remove if single-tenant
                if (property_exists($user, 'group_id') && $user->group_id) {
                    $qq->where('group_id', $user->group_id);
                }
            })
            ->when($validated['status'] ?? null, fn($qq, $status) => $qq->where('status', $status))
            ->when($validated['search'] ?? null, function ($qq, $search) {
                $qq->where(function ($w) use ($search) {
                    $w->where('from_e164', 'like', "%{$search}%")
                      ->orWhere('to_e164', 'like', "%{$search}%")
                      ->orWhere('caller_name', 'like', "%{$search}%")
                      ->orWhere('twilio_call_sid', 'like', "%{$search}%");
                });
            })
            ->orderBy($sort, $order);

        $paginated = $q->paginate($per)->appends($validated);

        return response()->json([
            'data' => $paginated->getCollection()->map(function (CallLog $c) {
                return [
                    'id'               => $c->id,
                    'from'             => $c->from_e164,
                    'to'               => $c->to_e164,
                    'caller_name'      => $c->caller_name,
                    'status'           => $c->status,
                    'started_at'       => optional($c->started_at)->toISOString(),
                    'ended_at'         => optional($c->ended_at)->toISOString(),
                    'duration_seconds' => $c->duration_seconds,
                    'metered_minutes'  => $c->metered_minutes,
                    'twilio_call_sid'  => $c->twilio_call_sid,
                ];
            }),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'last_page'    => $paginated->lastPage(),
                'sort'         => $sort,
                'order'        => $order,
            ],
        ]);
    }
}
