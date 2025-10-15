import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import UnitForm, { type UnitPayload } from '@/components/inventory/UnitForm';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs = (id: number): BreadcrumbItem[] => [
  { title: 'Listings', href: '/listings' },
  { title: 'Units', href: '/inventory/units' },
  { title: `Unit #${id}`, href: `/inventory/units/${id}/edit` },
];

type InventoryPayload = {
  buildings: Array<{ id: number; name: string }>;
  unitTypes: Array<{ id: number; name: string; building?: { id: number } | null }>;
};

type PageProps = {
  unit: UnitPayload & { id: number };
  inventory: InventoryPayload;
};

export default function UnitsEdit({ unit, inventory }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const confirmDelete = () => {
    if (!confirm('Delete this unit? Listings linked to it will revert to legacy data.')) return;
    destroy(`/inventory/units/${unit.id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(unit.id)}>
      <Head title={`Edit unit: ${unit.identifier || unit.id}`} />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <HeadingSmall
              title={unit.identifier || 'Unit'}
              description="Update the physical details that listings inherit."
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/inventory/units">Back</Link>
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={processing}>
                Delete
              </Button>
            </div>
          </div>

          <UnitForm
            action={`/inventory/units/${unit.id}`}
            method="put"
            defaults={unit}
            submitText="Save changes"
            buildings={inventory.buildings}
            unitTypes={inventory.unitTypes.map((type) => ({ id: type.id, name: type.name, building_id: type.building?.id }))}
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">Linked listings</h3>
            <p className="text-sm text-neutral-500">
              Listings that advertise this unit automatically inherit its rent, availability, and amenity information.
            </p>
            <div className="rounded-md border border-dashed p-4 text-sm text-neutral-500">
              <Badge variant="secondary" className="mr-2">
                Tip
              </Badge>
              Set the listing scope to “Single unit” to share these details without duplicating data.
            </div>
          </section>
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
