import type { ReportingPeriod } from '@/components/dashboard/types';

const monthLongFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
const rangeFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function buildPeriodForMonth(date: Date): ReportingPeriod {
    const utcYear = date.getUTCFullYear();
    const utcMonth = date.getUTCMonth();

    const start = new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(utcYear, utcMonth + 1, 0, 23, 59, 59, 999));

    return {
        label: monthLongFormatter.format(start),
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export function buildPeriodFromDates(startDate: Date, endDate: Date): ReportingPeriod {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    return {
        label: formatRangeLabel(start, end),
        start: start.toISOString(),
        end: end.toISOString(),
    };
}

export function formatRangeLabel(start: Date, end: Date): string {
    const sameMonth = start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();

    if (sameMonth) {
        return monthLongFormatter.format(start);
    }

    return `${rangeFormatter.format(start)} - ${rangeFormatter.format(end)}`;
}

export function getRecentMonths(count = 12): Date[] {
    const months: Date[] = [];
    const now = new Date();

    for (let i = 0; i < count; i += 1) {
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        months.push(date);
    }

    return months;
}
