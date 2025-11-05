import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import DashboardPeriodSelector from '@/components/dashboard/DashboardPeriodSelector';
import { buildPeriodForMonth } from '@/components/dashboard/period-utils';
import type { ReportingPeriod } from '@/components/dashboard/types';

type UsageSummary = {
    calls: number;
    completed: number;
    duration_seconds: number;
    metered_minutes: number;
    average_metered_minutes_per_call: number;
};

type UsageBreakdownRow = {
    date: string;
    calls: number;
    duration_seconds: number;
    metered_minutes: number;
    running_metered_minutes: number;
};

type UsageResponse = {
    period: {
        label: string;
        start: string;
        end: string;
    };
    summary: UsageSummary;
    breakdown: UsageBreakdownRow[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Usage', href: '/usage' },
];

function formatSeconds(seconds: number): string {
    if (!seconds || seconds <= 0) return '0s';
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    if (minutes === 0) {
        return `${remainder}s`;
    }
    if (remainder === 0) {
        return `${minutes}m`;
    }
    return `${minutes}m ${remainder}s`;
}

export default function UsageIndex() {
    const [period, setPeriod] = useState<ReportingPeriod>(() => buildPeriodForMonth(new Date()));
    const [usage, setUsage] = useState<UsageResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const integerFormatter = useMemo(
        () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }),
        [],
    );
    const decimalFormatter = useMemo(
        () => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }),
        [],
    );

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function fetchUsage() {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get<UsageResponse>('/api/v1/usage', {
                    params: {
                        start: period.start,
                        end: period.end,
                    },
                    signal: controller.signal,
                });
                if (!isMounted) return;
                setUsage(data);
            } catch (err) {
                if (!isMounted) return;
                if ((err as any)?.name === 'CanceledError') {
                    return;
                }
                setError('Unable to load usage data right now.');
                setUsage(null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchUsage();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [period]);

    const summary = usage?.summary;
    const totalMeteredMinutes = summary?.metered_minutes ?? 0;
    const totalCalls = summary?.calls ?? 0;
    const completedCalls = summary?.completed ?? 0;
    const averageMinutes = summary ? summary.average_metered_minutes_per_call : 0;
    const totalDurationSeconds = summary?.duration_seconds ?? 0;

    const breakdown = useMemo(() => usage?.breakdown ?? [], [usage]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Usage" />
            <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Metered usage</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Track billed call minutes for the selected period.
                        </p>
                    </div>
                    <DashboardPeriodSelector period={period} onChange={setPeriod} />
                </div>

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <UsageMetricCard
                        label="Metered minutes"
                        value={loading ? '—' : `${decimalFormatter.format(totalMeteredMinutes)} min`}
                        description={usage?.period.label ?? ''}
                    />
                    <UsageMetricCard
                        label="Total calls"
                        value={loading ? '—' : integerFormatter.format(totalCalls)}
                        description={loading ? '' : `${completedCalls} completed`}
                    />
                    <UsageMetricCard
                        label="Avg minutes per call"
                        value={loading ? '—' : `${decimalFormatter.format(averageMinutes)} min`}
                        description={totalCalls > 0 ? 'Based on metered usage' : 'No calls in range'}
                    />
                    <UsageMetricCard
                        label="Total duration"
                        value={loading ? '—' : formatSeconds(totalDurationSeconds)}
                        description="Actual time connected"
                    />
                </section>

                <section className="flex-1 overflow-hidden rounded-xl border border-sidebar-border/60 bg-white shadow-sm dark:border-sidebar-border dark:bg-neutral-950">
                    <header className="border-b border-sidebar-border/60 px-4 py-3 dark:border-sidebar-border">
                        <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                            Daily metered minutes
                        </h2>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Minutes are rounded up per call, matching metered billing.
                        </p>
                    </header>
                    <div className="max-h-[480px] overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="sticky top-0 bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:bg-neutral-900 dark:text-neutral-300">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2 text-right">Calls</th>
                                    <th className="px-4 py-2 text-right">Metered (min)</th>
                                    <th className="px-4 py-2 text-right">Running total</th>
                                    <th className="px-4 py-2 text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                            Loading usage…
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-red-600 dark:text-red-400">
                                            {error}
                                        </td>
                                    </tr>
                                ) : breakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                            No metered usage for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    breakdown.map((row) => (
                                        <tr key={row.date} className="border-t border-neutral-200/60 dark:border-neutral-800/70">
                                            <td className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200">
                                                {new Date(row.date).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-4 py-2 text-right text-neutral-700 dark:text-neutral-200">
                                                {integerFormatter.format(row.calls)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-neutral-700 dark:text-neutral-200">
                                                {decimalFormatter.format(row.metered_minutes)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-neutral-700 dark:text-neutral-200">
                                                {decimalFormatter.format(row.running_metered_minutes)}
                                            </td>
                                            <td className="px-4 py-2 text-right text-neutral-700 dark:text-neutral-200">
                                                {formatSeconds(row.duration_seconds)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}

type UsageMetricCardProps = {
    label: string;
    value: string;
    description?: string;
};

function UsageMetricCard({ label, value, description }: UsageMetricCardProps) {
    return (
        <div className="rounded-xl border border-neutral-200/70 bg-white p-4 shadow-sm dark:border-neutral-800/70 dark:bg-neutral-950">
            <p className="text-[11px] font-semibold uppercase tracking-tight text-neutral-500 dark:text-neutral-400">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
            {description ? (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
            ) : null}
        </div>
    );
}
