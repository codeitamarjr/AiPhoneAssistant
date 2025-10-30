import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import CallsCard from '@/components/calls/CallsCard';
import LeadsCard from '@/components/leads/LeadsCard';
import CallStatsWidget from '@/components/dashboard/CallStatsWidget';
import LeadStatsWidget from '@/components/dashboard/LeadStatsWidget';
import ViewingStatsWidget from '@/components/dashboard/ViewingStatsWidget';
import DashboardPeriodSelector from '@/components/dashboard/DashboardPeriodSelector';
import { buildPeriodForMonth } from '@/components/dashboard/period-utils';
import type { ReportingPeriod } from '@/components/dashboard/types';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [activePanel, setActivePanel] = useState<'calls' | 'leads'>('calls');
    const [period, setPeriod] = useState<ReportingPeriod>(() => buildPeriodForMonth(new Date()));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                    <DashboardPeriodSelector period={period} onChange={setPeriod} />
                </div>
                <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <CallStatsWidget className="h-full" period={period} />
                    <LeadStatsWidget className="h-full" period={period} />
                    <ViewingStatsWidget className="h-full" period={period} />
                </div>
                {/* Calls & Leads */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-white dark:border-sidebar-border dark:bg-neutral-950">
                    <div className="flex flex-col gap-3 border-b border-sidebar-border/70 p-4 md:flex-row md:items-center md:justify-between dark:border-sidebar-border">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setActivePanel('calls')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activePanel === 'calls'
                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                Calls
                            </button>
                            <button
                                type="button"
                                onClick={() => setActivePanel('leads')}
                                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activePanel === 'leads'
                                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                Leads
                            </button>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            Switch between live call activity and captured leads from the AI assistant.
                        </p>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {activePanel === 'calls' ? <CallsCard /> : <LeadsCard />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
