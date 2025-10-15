import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import UnitTypeForm, { type UnitTypePayload } from '@/components/inventory/UnitTypeForm';
import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Unit types', href: '/inventory/unit-types' },
  { title: 'Create', href: '/inventory/unit-types/create' },
];

type InventoryPayload = {
  buildings: Array<{ id: number; name: string }>;
};

type PageProps = {
  defaults: Partial<UnitTypePayload>;
  inventory: InventoryPayload;
};

export default function UnitTypesCreate({ defaults, inventory }: PageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create unit type" />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall title="New unit type" description="Template repeated layouts and rates." />
            <Button variant="outline" asChild>
              <Link href="/inventory/unit-types">Back to unit types</Link>
            </Button>
          </div>

          <UnitTypeForm
            action="/inventory/unit-types"
            method="post"
            defaults={defaults}
            submitText="Create"
            buildings={inventory.buildings}
          />
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
