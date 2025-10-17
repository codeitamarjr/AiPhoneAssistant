import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

type LeadStatsResponse = {
    period: {
        label: string;
        start: string;
        end: string;
    };
    leads: {
        total: number;
        unique_callers: number;
        by_status: Record<'new' | 'contacted' | 'qualified' | 'waitlist' | 'rejected', number>;
    };
    calls: {
        total: number;
        completed: number;
    };
    comparisons: {
        capture_rate_pct: number | null;
        call_gap: number;
    };
};

type LeadStatsWidgetProps = {
    className?: string;
};

export default function LeadStatsWidget({ className }: LeadStatsWidgetProps) {
    const [stats, setStats] = useState<LeadStatsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            try {
                const { data } = await axios.get<LeadStatsResponse>('/api/v1/leads/stats');
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

    const totalLeads = stats?.leads.total ?? 0;
    const uniqueCallers = stats?.leads.unique_callers ?? 0;
    const captureRate = stats?.comparisons.capture_rate_pct ?? null;
    const captureRateDisplay = captureRate != null ? `${captureRate}%` : '—';
    const callGap = stats?.comparisons.call_gap ?? 0;
    const totalCalls = stats?.calls.total ?? 0;
    const openLeads = useMemo(() => {
        if (!stats) return 0;
        const { new: newCount, contacted } = stats.leads.by_status;
        return newCount + contacted;
    }, [stats]);


    const captureProgress = Math.max(0, Math.min(100, captureRate ?? 0));
    return (
        <div
            className={clsx(
                'relative flex h-full flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-4 shadow-sm transition-colors dark:border-sidebar-border dark:bg-neutral-950',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/6 via-transparent to-emerald-500/3 dark:from-emerald-400/10 dark:to-emerald-400/6" />
            <div className="relative flex h-full flex-col gap-3">
                <header className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                            Leads captured
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100 md:text-3xl">
                            {loading ? '—' : totalLeads.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right text-[11px] text-neutral-500 dark:text-neutral-400">
                        {stats ? `${stats.period.label}` : 'Loading…'}
                    </div>
                </header>

                <section className="rounded-lg border border-neutral-200/70 px-3 py-2 dark:border-neutral-800/70">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>Capture rate</span>
                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : captureRateDisplay}
                        </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                        <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] dark:bg-emerald-400"
                            style={{ width: `${captureProgress}%` }}
                        />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                        <span>Call gap</span>
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : callGap.toLocaleString()}
                        </span>
                    </div>
                </section>

                <section className="grid grid-cols-3 gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                    <div className="rounded-lg border border-neutral-200/60 px-2 py-2 text-center dark:border-neutral-800/70">
                        <p className="uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                            Open
                        </p>
                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : openLeads.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg border border-neutral-200/60 px-2 py-2 text-center dark:border-neutral-800/70">
                        <p className="uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                            Qualified
                        </p>
                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : stats?.leads.by_status.qualified.toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg border border-neutral-200/60 px-2 py-2 text-center dark:border-neutral-800/70">
                        <p className="uppercase tracking-wide text-[10px] text-neutral-500 dark:text-neutral-400">
                            Unique callers
                        </p>
                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                            {loading ? '—' : uniqueCallers.toLocaleString()}
                        </p>
                    </div>
                </section>

                <footer className="mt-auto text-[11px] text-neutral-500 dark:text-neutral-400">
                    {error ? 'Unable to load lead stats right now.' : 'Updated every minute while calls are active.'}
                </footer>
            </div>
        </div>
    );
}
