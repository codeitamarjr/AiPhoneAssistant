<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\CallLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadApiController extends Controller
{
    public function stats(Request $request)
    {
        $user = $request->user();
        $periodStart = now()->startOfMonth();
        $periodEnd = now();

        $scopedLeads = Lead::query()
            ->when(method_exists($user, 'currentGroupId'), function ($q) use ($user) {
                $q->where('group_id', $user->currentGroupId());
            }, function ($q) use ($user) {
                if (property_exists($user, 'group_id') && $user->group_id) {
                    $q->where('group_id', $user->group_id);
                }
            })
            ->where('created_at', '>=', $periodStart);

        $totalLeads = (clone $scopedLeads)->count();
        $uniqueCallers = (clone $scopedLeads)->distinct('phone_e164')->count('phone_e164');
        $statusCounts = (clone $scopedLeads)
            ->select('status', DB::raw('count(*) as aggregate'))
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $scopedCalls = CallLog::query()
            ->when(method_exists($user, 'currentGroupId'), function ($q) use ($user) {
                $q->where('group_id', $user->currentGroupId());
            }, function ($q) use ($user) {
                if (property_exists($user, 'group_id') && $user->group_id) {
                    $q->where('group_id', $user->group_id);
                }
            })
            ->where('created_at', '>=', $periodStart);

        $totalCalls = (clone $scopedCalls)->count();
        $completedCalls = (clone $scopedCalls)->where('status', 'completed')->count();

        $captureRate = $totalCalls > 0 ? round(($totalLeads / $totalCalls) * 100) : null;
        $leadToCallGap = max($totalCalls - $totalLeads, 0);

        return response()->json([
            'period' => [
                'label' => $periodStart->format('F Y'),
                'start' => $periodStart->toISOString(),
                'end'   => $periodEnd->toISOString(),
            ],
            'leads' => [
                'total'          => $totalLeads,
                'unique_callers' => $uniqueCallers,
                'by_status'      => [
                    'new'        => (int) ($statusCounts['new'] ?? 0),
                    'contacted'  => (int) ($statusCounts['contacted'] ?? 0),
                    'qualified'  => (int) ($statusCounts['qualified'] ?? 0),
                    'waitlist'   => (int) ($statusCounts['waitlist'] ?? 0),
                    'rejected'   => (int) ($statusCounts['rejected'] ?? 0),
                ],
            ],
            'calls' => [
                'total'     => $totalCalls,
                'completed' => $completedCalls,
            ],
            'comparisons' => [
                'capture_rate_pct' => $captureRate,
                'call_gap'         => $leadToCallGap,
            ],
        ]);
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'in:new,contacted,qualified,waitlist,rejected'],
            'sort'   => ['nullable', 'in:created_at,name,status,source'],
            'order'  => ['nullable', 'in:asc,desc'],
            'page'   => ['nullable', 'integer', 'min:1'],
            'per'    => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $sort  = $validated['sort'] ?? 'created_at';
        $order = $validated['order'] ?? 'desc';
        $per   = $validated['per'] ?? 10;

        $query = Lead::query()
            ->with(['caller', 'callLog', 'listing'])
            ->when(method_exists($user, 'currentGroupId'), function ($q) use ($user) {
                $q->where('group_id', $user->currentGroupId());
            }, function ($q) use ($user) {
                if (property_exists($user, 'group_id') && $user->group_id) {
                    $q->where('group_id', $user->group_id);
                }
            })
            ->when($validated['status'] ?? null, fn($q, $status) => $q->where('status', $status))
            ->when($validated['search'] ?? null, function ($q, $search) {
                $q->where(function ($inner) use ($search) {
                    $inner
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('phone_e164', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('caller', function ($callerQ) use ($search) {
                            $callerQ->where('name', 'like', "%{$search}%")
                                ->orWhere('phone_e164', 'like', "%{$search}%");
                        })
                        ->orWhereHas('listing', function ($listingQ) use ($search) {
                            $listingQ->where('title', 'like', "%{$search}%")
                                ->orWhere('address', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy($sort, $order);

        $paginated = $query->paginate($per)->appends($validated);

        return response()->json([
            'data' => $paginated->getCollection()->map(function (Lead $lead) {
                $callLog = $lead->callLog;
                return [
                    'id'          => $lead->id,
                    'name'        => $lead->name,
                    'phone_e164'  => $lead->phone_e164,
                    'email'       => $lead->email,
                    'status'      => $lead->status,
                    'source'      => $lead->source,
                    'notes'       => $lead->notes,
                    'created_at'  => optional($lead->created_at)->toISOString(),
                    'listing'     => $lead->listing ? [
                        'id'    => $lead->listing->id,
                        'title' => $lead->listing->title,
                        'address' => $lead->listing->address,
                    ] : null,
                    'caller'      => $lead->caller ? [
                        'id'    => $lead->caller->id,
                        'name'  => $lead->caller->name,
                        'phone' => $lead->caller->phone_e164,
                    ] : null,
                    'call_log'    => $callLog ? [
                        'id'               => $callLog->id,
                        'status'           => $callLog->status,
                        'started_at'       => optional($callLog->started_at)->toISOString(),
                        'ended_at'         => optional($callLog->ended_at)->toISOString(),
                        'duration_seconds' => $callLog->duration_seconds,
                        'from'             => $callLog->from_e164,
                        'to'               => $callLog->to_e164,
                        'twilio_call_sid'  => $callLog->twilio_call_sid,
                    ] : null,
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

    public function update(Request $request, Lead $lead)
    {
        $user = $request->user();

        $data = $request->validate([
            'status' => ['required', 'in:new,contacted,qualified,waitlist,rejected'],
        ]);

        $groupId = null;
        if (method_exists($user, 'currentGroupId')) {
            $groupId = $user->currentGroupId();
        } elseif (property_exists($user, 'group_id') && $user->group_id) {
            $groupId = $user->group_id;
        }

        if ($groupId && (int) $lead->group_id !== (int) $groupId) {
            return response()->json(['message' => 'Lead not found'], 404);
        }

        if ($lead->status !== $data['status']) {
            $lead->status = $data['status'];
            $lead->save();
        }

        return response()->json([
            'ok' => true,
            'lead' => [
                'id'         => $lead->id,
                'status'     => $lead->status,
                'updated_at' => optional($lead->updated_at)->toISOString(),
            ],
        ]);
    }
}
