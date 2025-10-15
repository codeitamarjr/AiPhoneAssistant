import AppLayout from '@/layouts/app-layout';
import ListingForm, { type InventoryPayload } from '@/components/listings/ListingForm';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as L from '@/routes/listings';
import ListingsLayout from '@/layouts/listings/layout';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Listings', href: L.index().url },
  { title: 'Create', href: L.create().url },
];

type PageProps = {
  defaults: any;
  phoneNumbers: Array<{ id: number; phone_number: string; friendly_name?: string }>;
  inventory: InventoryPayload;
};

export default function ListingsCreate({ defaults, phoneNumbers, inventory }: PageProps) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create listing" />
      <ListingsLayout>
        <ListingForm
          action={L.store().url}
          method="post"
          defaults={defaults}
          submitText="Create"
          phoneNumbers={phoneNumbers}
          inventory={inventory}
        />
      </ListingsLayout>
    </AppLayout>
  );
}
