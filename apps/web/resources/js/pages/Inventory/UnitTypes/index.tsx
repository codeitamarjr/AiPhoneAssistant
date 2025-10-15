import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Unit types', href: '/inventory/unit-types' },
];

type UnitTypeRow = {
  id: number;
  name: string;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  default_rent?: number | null;
  quantity_available?: number | null;
  quantity_total?: number | null;
  building?: { id: number; name?: string | null } | null;
};

type PageProps = {
  unitTypes: UnitTypeRow[];
};

export default function UnitTypesIndex({ unitTypes }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const confirmDelete = (id: number) => {
    if (!confirm('Delete this unit type? Units referencing it will remain but lose the template link.')) return;
    destroy(`/inventory/unit-types/${id}`, { preserveScroll: true });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Unit types" />
      <ListingsLayout>
        <div className="space-y-6">
          <HeadingSmall title="Unit types" description="Reusable templates for similar units." />

          <div className="flex justify-end">
            <Button asChild>
              <Link href="/inventory/unit-types/create">New unit type</Link>
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase dark:bg-neutral-800">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Building</th>
                  <th className="px-4 py-2">Details</th>
                  <th className="px-4 py-2">Availability</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {unitTypes.map((type) => (
                  <tr key={type.id} className="border-t dark:border-neutral-800">
                    <td className="px-4 py-2 font-medium">{type.name}</td>
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-300">
                      {type.building?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {type.bedrooms != null && <Badge variant="secondary">{type.bedrooms} bed</Badge>}
                        {type.bathrooms != null && <Badge variant="secondary">{type.bathrooms} bath</Badge>}
                        {type.default_rent != null && <Badge variant="outline">€{type.default_rent}</Badge>}
                      </div>
                      {type.description && <p className="text-xs text-neutral-500">{type.description}</p>}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {type.quantity_available != null || type.quantity_total != null ? (
                        <span>
                          {type.quantity_available ?? '—'} / {type.quantity_total ?? '—'} available
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="flex gap-2 px-4 py-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/inventory/unit-types/${type.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="destructive" size="sm" disabled={processing} onClick={() => confirmDelete(type.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}

                {!unitTypes.length && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                      No unit types yet. Create one to scale marketing across similar homes.
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
