import AppLayout from '@/layouts/app-layout';
import ListingsLayout from '@/layouts/listings/layout';
import BuildingForm, { type BuildingPayload } from '@/components/inventory/BuildingForm';
import HeadingSmall from '@/components/heading-small';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: '/listings' },
  { title: 'Buildings', href: '/inventory/buildings' },
  { title: 'Create', href: '/inventory/buildings/create' },
];

type PageProps = {
  defaults: Partial<BuildingPayload>;
};

export default function BuildingsCreate({ defaults }: PageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create building" />
      <ListingsLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <HeadingSmall title="New building" description="Set shared address, amenities, and policies." />
            <Button variant="outline" asChild>
              <Link href="/inventory/buildings">Back to buildings</Link>
            </Button>
          </div>

          <BuildingForm action="/inventory/buildings" method="post" defaults={defaults} submitText="Create" />
        </div>
      </ListingsLayout>
    </AppLayout>
  );
}
