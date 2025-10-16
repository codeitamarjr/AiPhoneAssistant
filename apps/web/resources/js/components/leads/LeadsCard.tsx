import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LeadRow = {
  id: number;
  name: string | null;
  phone_e164: string;
  email: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'waitlist' | 'rejected' | string;
  source: string | null;
  notes: string | null;
  created_at: string | null;
  listing: {
    id: number;
    title: string | null;
    address: string | null;
  } | null;
  caller: {
    id: number;
    name: string | null;
    phone: string | null;
  } | null;
  call_log: {
    id: number;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    from: string;
    to: string;
    twilio_call_sid: string;
  } | null;
};

type LeadsResponse = {
  data: LeadRow[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    sort: string;
    order: 'asc' | 'desc';
  };
};

type SortKey = 'created_at' | 'name' | 'status' | 'source';

const statusBadges: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  qualified: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  waitlist: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  rejected: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
};

function formatWhen(iso: string | null) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', { hour12: false });
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

function titleCase(value: string | null | undefined) {
  if (!value) return '—';
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function LeadsCard() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState<SortKey>('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<LeadsResponse['meta'] | null>(null);
  const searchDebounce = useRef<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);

  const fetchLeads = async (opts?: Partial<{ page: number; per: number }>) => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: opts?.page ?? page,
        per: opts?.per ?? per,
        sort,
        order,
      };
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;

      const { data } = await axios.get<LeadsResponse>('/api/v1/leads', { params });
      setRows(data.data);
      setMeta(data.meta);
    } catch {
      // optional: surface error to user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchLeads({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, order, status]);

  useEffect(() => {
    if (searchDebounce.current) {
      window.clearTimeout(searchDebounce.current);
    }
    searchDebounce.current = window.setTimeout(() => {
      setPage(1);
      fetchLeads({ page: 1 });
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    const id = setInterval(() => fetchLeads(), 15000);
    return () => window.clearInterval(id);
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

  return (
    <>
      <div className="flex h-full w-full flex-1 flex-col overflow-hidden">
        {/* Header controls */}
        <div className="flex flex-col gap-3 border-b border-sidebar-border/60 p-4 md:flex-row md:items-center md:justify-between dark:border-sidebar-border">
          <div className="w-full md:w-1/2">
            <label className="sr-only" htmlFor="lead-search">Search</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8A4 4 0 008 4zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414L11.476 12.89A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="lead-search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search (name, phone, email, listing)"
                className="block w-full rounded-lg border border-neutral-300 bg-neutral-50 p-2 pl-10 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
              />
            </div>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
            <select
              value={status}
              id="lead-status"
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="waitlist">Waitlist</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={per}
              id="lead-per"
              onChange={(e) => { const v = Number(e.target.value); setPer(v); fetchLeads({ per: v, page: 1 }); }}
              className="rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {[10, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-x-auto">
            <table className={clsx("w-full text-left text-sm text-neutral-600 dark:text-neutral-300", loading && "opacity-60")}>
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                <tr>
                  <Th label="Created" active={sort === 'created_at'} order={order} onClick={() => onHeaderClick('created_at')} />
                  <Th label="Lead" active={sort === 'name'} order={order} onClick={() => onHeaderClick('name')} />
                  <th className="px-6 py-2">Phone</th>
                  <th className="hidden px-6 py-2 lg:table-cell">Listing</th>
                  <Th label="Status" active={sort === 'status'} order={order} onClick={() => onHeaderClick('status')} />
                  <Th label="Source" active={sort === 'source'} order={order} onClick={() => onHeaderClick('source')} />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-b border-neutral-200 bg-white transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    onClick={() => setSelectedLead(row)}
                  >
                    <td className="whitespace-nowrap px-6 py-2">{formatWhen(row.created_at)}</td>
                    <td className="px-6 py-2">{row.name ?? row.caller?.name ?? '—'}</td>
                    <td className="px-6 py-2">{row.phone_e164}</td>
                    <td className="hidden px-6 py-2 lg:table-cell">{row.listing?.title ?? '—'}</td>
                    <td className="px-6 py-2">
                      <span className={clsx(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        statusBadges[row.status] ?? "bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200"
                      )}>
                        {titleCase(row.status)}
                      </span>
                    </td>
                    <td className="px-6 py-2">{titleCase(row.source)}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-neutral-500 dark:text-neutral-400">
                      {loading ? 'Loading…' : 'No leads yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 border-t border-sidebar-border/60 p-4 text-xs text-neutral-500 dark:border-sidebar-border">
          {meta ? (
            <>Page {meta.current_page} of {meta.last_page} • {meta.total} total</>
          ) : <span>&nbsp;</span>}

          <div className="flex items-center gap-2">
            <button
              onClick={() => { if ((meta?.current_page ?? 1) > 1) { setPage((p) => p - 1); fetchLeads({ page: (meta!.current_page - 1) }); } }}
              disabled={!meta || meta.current_page <= 1 || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              Prev
            </button>
            <button
              onClick={() => { if ((meta?.current_page ?? 1) < (meta?.last_page ?? 1)) { setPage((p) => p + 1); fetchLeads({ page: (meta!.current_page + 1) }); } }}
              disabled={!meta || meta.current_page >= (meta?.last_page ?? 1) || loading}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-neutral-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLead?.name ?? selectedLead?.caller?.name ?? selectedLead?.phone_e164 ?? 'Lead details'}</DialogTitle>
            <DialogDescription>
              Captured by the AI assistant and synced with the call log.
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6 text-sm">
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Lead</h3>
                <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Name</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{selectedLead.name ?? selectedLead.caller?.name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Phone</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{selectedLead.phone_e164}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Email</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{selectedLead.email ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{titleCase(selectedLead.status)}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Source</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{titleCase(selectedLead.source)}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Created</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{formatWhen(selectedLead.created_at)}</dd>
                  </div>
                </dl>
                {selectedLead.listing && (
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Listing</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">
                      {selectedLead.listing.title ?? '—'}
                      {selectedLead.listing.address ? <span className="block text-xs text-neutral-500 dark:text-neutral-400">{selectedLead.listing.address}</span> : null}
                    </dd>
                  </div>
                )}
                {selectedLead.notes && (
                  <div>
                    <dt className="text-neutral-500 dark:text-neutral-400">Notes</dt>
                    <dd className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{selectedLead.notes}</dd>
                  </div>
                )}
              </section>

              {selectedLead.call_log && (
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Linked Call</h3>
                  <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">Status</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{titleCase(selectedLead.call_log.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">Duration</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{formatDuration(selectedLead.call_log.duration_seconds)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">From</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{selectedLead.call_log.from}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">To</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{selectedLead.call_log.to}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">Started</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{formatWhen(selectedLead.call_log.started_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500 dark:text-neutral-400">Ended</dt>
                      <dd className="font-medium text-neutral-900 dark:text-neutral-100">{formatWhen(selectedLead.call_log.ended_at)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-neutral-500 dark:text-neutral-400">Call SID</dt>
                      <dd className="font-mono text-xs text-neutral-700 dark:text-neutral-300">{selectedLead.call_log.twilio_call_sid}</dd>
                    </div>
                  </dl>
                </section>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
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
          <svg className={clsx("h-4 w-4 transition-transform", order === 'asc' ? 'rotate-180' : '')} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7l-7 7h14z" />
          </svg>
        )}
      </div>
    </th>
  );
}
