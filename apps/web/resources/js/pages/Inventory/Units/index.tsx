import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Units', href: '/inventory/units' },
];

type UnitRow = {
  id: number;
  identifier: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rent?: number | null;
  available_from?: string | null;
  is_active: boolean;
  building?: { id: number; name?: string | null } | null;
  unit_type?: { id: number; name: string } | null;
};

type PageProps = {
  units: UnitRow[];
};

export default function UnitsIndex({ units }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const confirmDelete = (id: number) => {
    if (!confirm('Delete this unit? Linked listings will fall back to legacy data.')) return;
    destroy(`/inventory/units/${id}`, { preserveScroll: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Units" />
      <ListingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Units" description="Physical homes the assistant can talk about." />

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/inventory/units/create">New unit</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-2">Identifier</th>
                  <th className="px-4 py-2">Building</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Details</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-2 font-medium">{unit.identifier}</td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-300">
                      {unit.building?.name ?? 'Standalone'}
                    </td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-300">
                      {unit.unit_type?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {unit.bedrooms != null && <Badge variant="secondary">{unit.bedrooms} bed</Badge>}
                        {unit.bathrooms != null && <Badge variant="secondary">{unit.bathrooms} bath</Badge>}
                        {unit.rent != null && <Badge variant="outline">€{unit.rent}</Badge>}
                        {unit.available_from && (
                          <Badge variant="outline">From {new Date(unit.available_from).toLocaleDateString()}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant={unit.is_active ? 'default' : 'secondary'}>
                        {unit.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="flex gap-2 px-4 py-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inventory/units/${unit.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="destructive" size="sm" disabled={processing} onClick={() => confirmDelete(unit.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {!units.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">
                      No units yet. Import or create units before assigning them to listings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
