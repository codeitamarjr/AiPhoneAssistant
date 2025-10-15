import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import UnitTypeForm, { type UnitTypePayload } from '@/components/inventory/UnitTypeForm';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs = (id: number): BreadcrumbItem[] => [
  { title: 'Listings', href: '/listings' },
  { title: 'Unit types', href: '/inventory/unit-types' },
  { title: `Unit type #${id}`, href: `/inventory/unit-types/${id}/edit` },
];

type InventoryPayload = {
  buildings: Array<{ id: number; name: string }>;
};

type PageProps = {
  unitType: UnitTypePayload & { id: number };
  inventory: InventoryPayload;
};

export default function UnitTypesEdit({ unitType, inventory }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const confirmDelete = () => {
    if (!confirm('Delete this unit type?')) return;
    destroy(`/inventory/unit-types/${unitType.id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(unitType.id)}>
      <Head title={`Edit unit type: ${unitType.name}`} />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <HeadingSmall
              title={unitType.name}
              description="Adjust template defaults used by similar units."
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/inventory/unit-types">Back</Link>
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={processing}>
                Delete
              </Button>
            </div>
          </div>

          <UnitTypeForm
            action={`/inventory/unit-types/${unitType.id}`}
            method="put"
            defaults={unitType}
            submitText="Save changes"
            buildings={inventory.buildings}
          />

          <section className="rounded-md border border-dashed p-4 text-sm text-neutral-500">
            <Badge variant="secondary" className="mr-2">
              Tip
            </Badge>
            Link units to this type to auto-fill rent, floor area, and feature defaults.
          </section>
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
