import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import BuildingForm, { type BuildingPayload } from '@/components/inventory/BuildingForm';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Link, Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';

const breadcrumbs = (id: number): BreadcrumbItem[] => [
  { title: 'Listings', href: '/listings' },
  { title: 'Buildings', href: '/inventory/buildings' },
  { title: `Building #${id}`, href: `/inventory/buildings/${id}/edit` },
];

type InventoryPayload = {
  units: Array<{
    id: number;
    identifier: string;
    building?: { id: number; name: string | null } | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    rent?: number | null;
    available_from?: string | null;
  }>;
  unitTypes: Array<{
    id: number;
    name: string;
    building?: { id: number; name: string | null } | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    default_rent?: number | null;
  }>;
};

type PageProps = {
  building: BuildingPayload & { id: number };
  inventory: InventoryPayload;
};

export default function BuildingsEdit({ building, inventory }: PageProps) {
  const { delete: destroy, processing } = useForm();

  const buildingUnits = inventory.units.filter((unit) => unit.building?.id === building.id);
  const buildingUnitTypes = inventory.unitTypes.filter((type) => type.building?.id === building.id);

  const confirmDelete = () => {
    if (buildingUnits.length > 0) {
      alert('Remove or reassign units before deleting this building.');
      return;
    }
    if (!confirm('Delete this building?')) return;
    destroy(`/inventory/buildings/${building.id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs(building.id)}>
      <Head title={`Edit building: ${building.name || building.address_line1 || building.id}`} />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <HeadingSmall
              title={building.name || building.address_line1 || 'Building'}
              description="Shared context for units in this location."
            />
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/inventory/buildings">Back</Link>
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={processing || buildingUnits.length > 0}>
                Delete
              </Button>
            </div>
          </div>

          <BuildingForm
            action={`/inventory/buildings/${building.id}`}
            method="put"
            defaults={building}
            submitText="Save changes"
          />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">Units in this building</h3>
            {buildingUnits.length ? (
              <div className="space-y-3">
                {buildingUnits.map((unit) => (
                  <div key={unit.id} className="flex flex-wrap items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{unit.identifier}</span>
                      <span className="text-neutral-500">
                        {unit.bedrooms != null && <Badge variant="secondary" className="mr-2">{unit.bedrooms} bed</Badge>}
                        {unit.bathrooms != null && <Badge variant="secondary" className="mr-2">{unit.bathrooms} bath</Badge>}
                        {unit.rent != null && <Badge variant="outline">€{unit.rent}</Badge>}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inventory/units/${unit.id}/edit`}>Manage</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No units assigned to this building yet. <Link className="underline" href="/inventory/units/create">Add one now</Link>.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">Unit types</h3>
            {buildingUnitTypes.length ? (
              <div className="space-y-3">
                {buildingUnitTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{type.name}</span>
                      <span className="text-neutral-500">
                        {type.bedrooms != null && <Badge variant="secondary" className="mr-2">{type.bedrooms} bed</Badge>}
                        {type.bathrooms != null && <Badge variant="secondary" className="mr-2">{type.bathrooms} bath</Badge>}
                        {type.default_rent != null && <Badge variant="outline">€{type.default_rent}</Badge>}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/inventory/unit-types/${type.id}/edit`}>Manage</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">
                No unit types yet. <Link className="underline" href="/inventory/unit-types/create">Create one</Link> to reuse templates.
              </p>
            )}
          </section>
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
