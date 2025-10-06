import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';

type CallRow = {
  id: number;
  from: string;
  to: string;
  caller_name: string | null;
  status: 'in-progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled' | string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  twilio_call_sid: string;
};

type CallsResponse = {
  data: CallRow[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    sort: string;
    order: 'asc' | 'desc';
  };
};

const statusClasses: Record<string, string> = {
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'completed':   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'failed':      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'busy':        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'no-answer':   'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'canceled':    'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

function formatWhen(iso: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(); // uses browser locale; swap for Intl.DateTimeFormat if you want forced tz/format
  } catch {
    return iso;
  }
}

function formatDuration(secs: number | null) {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type SortKey = 'started_at' | 'from' | 'caller_name' | 'to' | 'status' | 'duration_seconds';

export default function CallsCard() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('started_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<CallsResponse['meta'] | null>(null);
  const searchDebounce = useRef<number | null>(null);

  const fetchCalls = async (opts?: Partial<{ page:number; per:number }>) => {
    setLoading(true);
    try {
      const params: any = {
        page: opts?.page ?? page,
        per:  opts?.per ?? per,
        sort,
        order,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const { data } = await axios.get<CallsResponse>('/api/v1/calls', { params });
      setRows(data.data);
      setMeta(data.meta);
    } catch (e) {
      // noop; you could toast an error
    } finally {
      setLoading(false);
    }
  };

  // Initial + whenever filters/sort change
  useEffect(() => {
    fetchCalls({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, order, status]);

  // Debounce search
  useEffect(() => {
    if (searchDebounce.current) window.clearTimeout(searchDebounce.current);
    searchDebounce.current = window.setTimeout(() => {
      fetchCalls({ page: 1 });
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Auto-refresh every 10s (keeps table fresh)
  useEffect(() => {
    const id = setInterval(() => fetchCalls(), 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, per, sort, order, search, status]);

  const onHeaderClick = (key: SortKey) => {
    if (sort === key) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key);
      setOrder('asc');
    }
  };

  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="flex h-full w-full flex-1 flex-col gap-4 rounded-xl">
      <div className="relative h-full flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
        {/* Header controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4">
          <div className="w-full md:w-1/2">
            <label className="sr-only" htmlFor="call-search">Search</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8A4 4 0 008 4zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L11.476 12.89A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>
              <input
                id="call-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search (number, name, SID)"
                className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
            {/* Status filter */}
            <select
              value={status}
              id="call-status"
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">All statuses</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="busy">Busy</option>
              <option value="no-answer">No answer</option>
              <option value="failed">Failed</option>
              <option value="canceled">Canceled</option>
            </select>

            {/* Per-page */}
            <select
              value={per}
              id="call-per"
              onChange={(e) => { const v = Number(e.target.value); setPer(v); fetchCalls({ per: v, page: 1 }); }}
              className="rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {[10,20,50].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className={clsx("w-full text-left text-sm text-neutral-600 dark:text-neutral-300", loading && "opacity-60")}>
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
              <tr>
                <Th label="When"         active={sort==='started_at'} order={order} onClick={() => onHeaderClick('started_at')} />
                <Th label="From"         active={sort==='from'}       order={order} onClick={() => onHeaderClick('from')} />
                <th className="px-6 py-2">Name</th>
                <Th label="To"           active={sort==='to'}         order={order} onClick={() => onHeaderClick('to')} />
                <Th label="Status"       active={sort==='status'}     order={order} onClick={() => onHeaderClick('status')} />
                <Th label="Duration"     active={sort==='duration_seconds'} order={order} onClick={() => onHeaderClick('duration_seconds')} />
                <th className="px-6 py-2 hidden md:table-cell">SID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                  <td className="px-6 py-2 whitespace-nowrap">{formatWhen(r.started_at)}</td>
                  <td className="px-6 py-2">{r.from}</td>
                  <td className="px-6 py-2">{r.caller_name ?? '—'}</td>
                  <td className="px-6 py-2">{r.to}</td>
                  <td className="px-6 py-2">
                    <span className={clsx(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      statusClasses[r.status] ?? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-2">{formatDuration(r.duration_seconds)}</td>
                  <td className="px-6 py-2 text-[11px] text-neutral-500 dark:text-neutral-400 hidden md:table-cell">{r.twilio_call_sid}</td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-neutral-500 dark:text-neutral-400">
                    {loading ? 'Loading…' : 'No calls yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="text-xs text-neutral-500">
            {meta ? (
              <>Page {meta.current_page} of {meta.last_page} • {meta.total} total</>
            ) : <>&nbsp;</>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { if ((meta?.current_page ?? 1) > 1) { setPage((p) => p - 1); fetchCalls({ page: (meta!.current_page - 1) }); } }}
              disabled={!meta || meta.current_page <= 1 || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              Prev
            </button>
            <button
              onClick={() => { if ((meta?.current_page ?? 1) < (meta?.last_page ?? 1)) { setPage((p) => p + 1); fetchCalls({ page: (meta!.current_page + 1) }); } }}
              disabled={!meta || meta.current_page >= (meta?.last_page ?? 1) || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th scope="col" className="cursor-pointer select-none px-6 py-2" onClick={onClick}>
      <div className="flex items-center gap-1">
        {label}
        {active && (
          <svg className={clsx("h-4 w-4 transition-transform", order === 'asc' ? "rotate-180" : "")}
               viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7l-7 7h14z" />
          </svg>
        )}
      </div>
    </th>
  );
}
