import { type FormEvent, useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReportingPeriod } from '@/components/dashboard/types';
import { buildPeriodForMonth, buildPeriodFromDates, getRecentMonths } from '@/components/dashboard/period-utils';

type DashboardPeriodSelectorProps = {
    period: ReportingPeriod;
    onChange: (period: ReportingPeriod) => void;
};

export default function DashboardPeriodSelector({ period, onChange }: DashboardPeriodSelectorProps) {
    const [open, setOpen] = useState(false);
    const [customStart, setCustomStart] = useState(period.start.slice(0, 10));
    const [customEnd, setCustomEnd] = useState(period.end.slice(0, 10));

    const recentMonths = useMemo(() => getRecentMonths(12), []);

    const handleCustomSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!customStart || !customEnd) return;

        const startDate = new Date(`${customStart}T00:00:00Z`);
        const endDate = new Date(`${customEnd}T00:00:00Z`);

        if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf()) || endDate < startDate) {
            return;
        }

        onChange(buildPeriodFromDates(startDate, endDate));
        setOpen(false);
    };

    const isApplyDisabled = !customStart || !customEnd || new Date(`${customEnd}T00:00:00Z`) < new Date(`${customStart}T00:00:00Z`);

    return (
        <DropdownMenu
            open={open}
            onOpenChange={(next) => {
                setOpen(next);
                if (next) {
                    setCustomStart(period.start.slice(0, 10));
                    setCustomEnd(period.end.slice(0, 10));
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                    <CalendarDays className="size-4" />
                    <span>{period.label}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Select period</DropdownMenuLabel>
                {recentMonths.map((monthDate) => {
                    const periodForMonth = buildPeriodForMonth(monthDate);
                    const isSelected = periodForMonth.start === period.start && periodForMonth.end === period.end;

                    return (
                        <DropdownMenuItem
                            key={periodForMonth.start}
                            onSelect={(event) => {
                                event.preventDefault();
                                onChange(periodForMonth);
                                setOpen(false);
                            }}
                            className={isSelected ? 'bg-neutral-100 dark:bg-neutral-800' : undefined}
                        >
                            {periodForMonth.label}
                        </DropdownMenuItem>
                    );
                })}
                <DropdownMenuSeparator />
                <form className="space-y-2 px-2 py-1.5" onSubmit={handleCustomSubmit}>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Custom range
                    </div>
                    <div className="grid gap-2">
                        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Start date
                            <input
                                type="date"
                                value={customStart}
                                onChange={(event) => setCustomStart(event.target.value)}
                                className="rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                max={customEnd || undefined}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            End date
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(event) => setCustomEnd(event.target.value)}
                                className="rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                                min={customStart || undefined}
                            />
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={isApplyDisabled}
                        className="w-full rounded-md bg-blue-600 px-2 py-1.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-neutral-300 dark:disabled:bg-neutral-700"
                    >
                        Apply
                    </button>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
