import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import UnitForm, { type UnitPayload } from '@/components/inventory/UnitForm';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Units', href: '/inventory/units' },
  { title: 'Create', href: '/inventory/units/create' },
];

type InventoryPayload = {
  buildings: Array<{ id: number; name: string }>;
  unitTypes: Array<{ id: number; name: string; building?: { id: number } | null }>;
};

type PageProps = {
  defaults: Partial<UnitPayload>;
  inventory: InventoryPayload;
};

export default function UnitsCreate({ defaults, inventory }: PageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create unit" />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall title="New unit" description="Capture the physical property details once." />
            <Button variant="outline" asChild>
              <Link href="/inventory/units">Back to units</Link>
            </Button>
          </div>

          <UnitForm
            action="/inventory/units"
            method="post"
            defaults={defaults}
            submitText="Create"
            buildings={inventory.buildings}
            unitTypes={inventory.unitTypes.map((type) => ({ id: type.id, name: type.name, building_id: type.building?.id }))}
          />
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
