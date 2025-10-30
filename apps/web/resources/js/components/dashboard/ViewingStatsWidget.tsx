import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import type { ReportingPeriod } from '@/components/dashboard/types';

type ViewingStatsResponse = {
    period: {
        label: string;
        start: string;
        end: string;
    };
    viewings: {
        total: number;
        scheduled: number;
        cancelled: number;
    };
};

type ViewingStatsWidgetProps = {
    className?: string;
    period: ReportingPeriod;
};

export default function ViewingStatsWidget({ className, period }: ViewingStatsWidgetProps) {
    const [stats, setStats] = useState<ViewingStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const { data } = await axios.get<ViewingStatsResponse>('/api/v1/viewings/stats', {
                    params: {
                        start: period.start,
                        end: period.end,
                    },
                });
                if (!isMounted) return;
                setStats(data);
                setError(false);
            } catch (e) {
                if (!isMounted) return;
                setError(true);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        setLoading(true);
        setStats(null);
        setError(false);
        fetchStats();
        const interval = window.setInterval(fetchStats, 60000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, [period]);

    const total = stats?.viewings.total ?? 0;
    const scheduled = stats?.viewings.scheduled ?? 0;
    const cancelled = stats?.viewings.cancelled ?? 0;

    const fulfilRate = useMemo(() => {
        if (!stats || stats.viewings.total === 0) return 0;
        return Math.round((stats.viewings.scheduled / Math.max(stats.viewings.total, 1)) * 100);
    }, [stats]);

    const cancellationRate = useMemo(() => {
        if (!stats || stats.viewings.total === 0) return 0;
        return Math.round((stats.viewings.cancelled / Math.max(stats.viewings.total, 1)) * 100);
    }, [stats]);

    return (
        <div
            className={clsx(
                'relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm transition-colors dark:border-sidebar-border dark:bg-neutral-950',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/6 via-transparent to-amber-500/3 dark:from-amber-400/10 dark:to-amber-400/6" />
            <div className="relative flex h-full flex-col gap-3">
                <header className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Viewings booked
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
                            {loading ? '—' : total.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right text-[11px] text-neutral-500 dark:text-neutral-400">
                        {stats ? `${stats.period.label}` : loading ? 'Loading…' : period.label}
                    </div>
                </header>

                <section className="grid gap-2 text-[11px] text-neutral-600 dark:text-neutral-300 sm:grid-cols-2">
                    <div className="rounded-lg border border-neutral-200/70 px-3 py-2 dark:border-neutral-800/70">
                        <p className="font-semibold uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                            Fulfilment
                        </p>
                        <p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : `${fulfilRate}%`}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Scheduled vs total</p>
                    </div>
                    <div className="rounded-lg border border-neutral-200/70 px-3 py-2 dark:border-neutral-800/70">
                        <p className="font-semibold uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                            Cancellations
                        </p>
                        <p className="mt-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : `${cancelled.toLocaleString()} (${cancellationRate}%)`}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">This month</p>
                    </div>
                </section>

                <footer className="mt-auto text-[11px] text-neutral-500 dark:text-neutral-400">
                    {error ? 'Unable to load viewing stats right now.' : 'Refreshed every minute while appointments change.'}
                </footer>
            </div>
        </div>
    );
}
