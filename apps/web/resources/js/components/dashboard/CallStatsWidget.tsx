import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

type CallStatsResponse = {
    period: {
        label: string;
        start: string;
        end: string;
    };
    calls: {
        total: number;
        completed: number;
        duration_seconds: number;
    };
};

type CallStatsWidgetProps = {
    className?: string;
};

export default function CallStatsWidget({ className }: CallStatsWidgetProps) {
    const [stats, setStats] = useState<CallStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const { data } = await axios.get<CallStatsResponse>('/api/v1/calls/stats');
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

        fetchStats();
        const interval = window.setInterval(fetchStats, 60000);

        return () => {
            isMounted = false;
            window.clearInterval(interval);
        };
    }, []);

    const totalCalls = stats?.calls.total ?? 0;
    const completedCalls = stats?.calls.completed ?? 0;
    const totalMinutes = useMemo(() => {
        const seconds = stats?.calls.duration_seconds ?? 0;
        if (seconds <= 0) return 0;
        return Math.round(seconds / 60);
    }, [stats]);

    const completionRate = useMemo(() => {
        if (!stats || stats.calls.total === 0) return 0;
        return Math.round((stats.calls.completed / Math.max(stats.calls.total, 1)) * 100);
    }, [stats]);

    const minutesDisplay = stats
        ? totalMinutes > 0
            ? totalMinutes.toLocaleString()
            : stats.calls.duration_seconds > 0
                ? '<1'
                : '0'
        : '—';

    return (
        <div
            className={clsx(
                'relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 shadow-sm transition-colors dark:border-sidebar-border dark:bg-neutral-950',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/8 via-transparent to-blue-500/4 dark:from-blue-400/10 dark:to-blue-400/6" />
            <div className="relative flex flex-col gap-4">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Calls this month
                    </p>
                    <p className="mt-2 text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {loading ? '—' : totalCalls.toLocaleString()}
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Minutes handled
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : `${minutesDisplay} min`}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Completed calls
                        </p>
                        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-200">
                            {loading ? '—' : `${completedCalls.toLocaleString()} (${completionRate}% done)`}
                        </p>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                            <div
                                className="h-full rounded-full bg-primary-500 transition-[width] dark:bg-primary-400"
                                style={{ width: `${completionRate}%` }}
                            />
                        </div>
                    </div>
                </div>
                <p className="mt-auto text-xs text-neutral-500 dark:text-neutral-400">
                    {error
                        ? 'Unable to load stats right now.'
                        : stats
                            ? `Month to date • ${stats.period.label}`
                            : 'Fetching call stats…'}
                </p>
            </div>
        </div>
    );
}
