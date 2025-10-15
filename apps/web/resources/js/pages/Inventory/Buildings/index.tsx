import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Link, Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Buildings', href: '/inventory/buildings' },
];

type Building = {
  id: number;
  name: string;
  address_line1?: string | null;
  city?: string | null;
  county?: string | null;
  postcode?: string | null;
  units_count: number;
  unit_types_count: number;
};

type PageProps = {
  buildings: Building[];
};

export default function BuildingsIndex({ buildings }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const confirmDelete = (id: number) => {
    if (!confirm('Delete this building? Units must be re-assigned first.')) return;
    destroy(`/inventory/buildings/${id}`, { preserveScroll: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Buildings" />
      <ListingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Buildings" description="Group related units and shared amenities." />

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/inventory/buildings/create">New building</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Address</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">Unit types</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-2 font-medium">{building.name}</td>
                    <td className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {[building.address_line1, building.city, building.postcode].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-2">{building.units_count}</td>
                    <td className="px-4 py-2">{building.unit_types_count}</td>
                    <td className="flex gap-2 px-4 py-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inventory/buildings/${building.id}/edit`}>Edit</Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={processing || building.units_count > 0}
                        onClick={() => confirmDelete(building.id)}
                        title={building.units_count > 0 ? 'Remove units before deleting' : 'Delete building'}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {!buildings.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                      No buildings yet. Create one to share amenities and defaults across units.
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
