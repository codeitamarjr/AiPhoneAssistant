<?php

namespace App\Http\Controllers\Concerns;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

trait ResolvesPeriod
{
    /**
     * Resolve the reporting period from the request.
     *
     * Supports either a specific month (YYYY-MM) or explicit start/end dates.
     * Defaults to the current month-to-date window when no parameters are provided.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable, 2: string}
     */
    protected function resolvePeriod(Request $request): array
    {
        $validated = $request->validate([
            'month' => ['nullable', 'date_format:Y-m'],
            'start' => ['nullable', 'date'],
            'end' => ['nullable', 'date', 'after_or_equal:start'],
        ]);

        $now = CarbonImmutable::now();
        $timezone = $now->getTimezone();

        if (!empty($validated['month'])) {
            $periodStart = CarbonImmutable::createFromFormat('Y-m-d', "{$validated['month']}-01", $timezone)->startOfMonth();
            $periodEnd = $periodStart->endOfMonth();
            $label = $periodStart->format('F Y');

            return [$periodStart, $periodEnd, $label];
        }

        $periodStart = !empty($validated['start'])
            ? CarbonImmutable::parse($validated['start'], $timezone)->startOfDay()
            : $now->startOfMonth();

        $periodEnd = !empty($validated['end'])
            ? CarbonImmutable::parse($validated['end'], $timezone)->endOfDay()
            : ($periodStart->isSameMonth($now) ? $now : $periodStart->endOfMonth());

        if ($periodEnd->lessThan($periodStart)) {
            $periodEnd = $periodStart->endOfDay();
        }

        $label = $periodStart->isSameMonth($periodEnd)
            ? $periodStart->format('F Y')
            : $periodStart->format('M j, Y') . ' - ' . $periodEnd->format('M j, Y');

        return [$periodStart, $periodEnd, $label];
    }
}
