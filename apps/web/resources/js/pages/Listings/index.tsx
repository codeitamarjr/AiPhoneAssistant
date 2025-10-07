import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, Head, useForm } from '@inertiajs/react';
import * as L from '@/routes/listings';
import { useEffect, useState } from 'react';
import { type BreadcrumbItem } from '@/types';

type Listing = {
  id: number;
  title: string | null;
  address: string | null;
  postcode: string | null;
  rent_eur: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  available_from: string | null; // ISO date
  created_at?: string;
};

type PageProps = {
  listings: {
    data: Listing[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
  };
  filters: {
    search: string;
    sort: string;
    order: 'asc' | 'desc';
    per: number;
  };
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: L.index().url },
];

export default function ListingsIndex({ listings, filters }: PageProps) {
  const [search, setSearch] = useState(filters.search ?? '');
  const { get, delete: destroy, processing } = useForm();

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => {
      get(L.index().url, { preserveScroll: true, preserveState: true, data: { ...filters, search } });
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleSort = (key: string) => {
    const order = (filters.sort === key && filters.order === 'asc') ? 'desc' : 'asc';
    get(L.index().url, { preserveScroll: true, preserveState: true, data: { ...filters, sort: key, order } });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Listings" />
      <ListingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Listings" description="Manage the properties your assistant can answer for" />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:w-1/2">
              <Input
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href={L.create().url}>New Listing</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase dark:bg-neutral-800">
                <tr>
                  <Th label="Title" onClick={() => toggleSort('title')} active={filters.sort === 'title'} order={filters.order} />
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">postcode</th>
                  <Th label="Rent" onClick={() => toggleSort('rent_eur')} active={filters.sort === 'rent_eur'} order={filters.order} />
                  <th className="px-4 py-2">Beds</th>
                  <th className="px-4 py-2">Baths</th>
                  <Th label="Available" onClick={() => toggleSort('available_from')} active={filters.sort === 'available_from'} order={filters.order} />
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {listings.data.map((l) => (
                  <tr key={l.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-2 font-medium text-nowrap">{l.title ?? '—'}</td>
                    <td className="px-4 py-2">{l.address ?? '—'}</td>
                    <td className="px-4 py-2 text-nowrap">{l.postcode ?? '—'}</td>
                    <td className="px-4 py-2">{l.rent != null ? `€${l.rent}` : '—'}</td>
                    <td className="px-4 py-2">{l.bedrooms ?? '—'}</td>
                    <td className="px-4 py-2">{l.bathrooms ?? '—'}</td>
                    <td className="px-4 py-2">{l.available_from
                      ? new Date(l.available_from).toLocaleDateString('en-GB')
                      : '—'}</td>
                    <td className="px-4 py-2 flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={L.edit(l.id).url}>Edit</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        onClick={() => {
                          if (confirm('Delete this listing?')) {
                            destroy(L.destroy(l.id).url, { preserveScroll: true });
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {!listings.data.length && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">No listings found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Simple pagination (uses Laravel's paginator links) */}
          <div className="flex flex-wrap items-center gap-2">
            {listings.links.map((lnk, i) => (
              <Button
                key={i}
                variant={lnk.active ? 'default' : 'outline'}
                size="sm"
                disabled={!lnk.url}
                onClick={() => lnk.url && get(lnk.url, { preserveScroll: true, preserveState: true })}
              >
                {/* labels come with &laquo; etc. stripped (Laravel) */}
                <span dangerouslySetInnerHTML={{ __html: lnk.label }} />
              </Button>
            ))}
          </div>
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}

function Th({ label, active, order, onClick }: { label: string; active?: boolean; order?: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <th className="cursor-pointer select-none px-4 py-2" onClick={onClick}>
      <div className="flex items-center gap-1">
        {label}
        {active && (
          <svg className={`h-4 w-4 transition-transform ${order === 'asc' ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7l-7 7h14z" />
          </svg>
        )}
      </div>
    </th>
  );
}
