import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import ListingForm, { type InventoryPayload, ListingPayload } from '@/components/listings/ListingForm';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as L from '@/routes/listings';
import ListingsLayout from '@/layouts/listings/layout';

type PageProps = {
  listing: ListingPayload & { id: number; advertised_unit_ids?: Array<number | string> };
  phoneNumbers: Array<{ id: number; phone_number: string; friendly_name?: string }>;
  inventory: InventoryPayload;
};

export default function ListingsEdit({ listing, phoneNumbers, inventory }: PageProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Listings', href: L.index().url },
    { title: 'Edit', href: L.edit(listing.id).url },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit: ${listing.title ?? 'Listing'}`} />
      <ListingsLayout>
        <ListingForm
          action={L.update(listing.id).url}
          method="put"
          defaults={listing}
          phoneNumbers={phoneNumbers}
          submitText="Save"
          inventory={inventory}
        />
      </ListingsLayout>
    </AppLayout>
  );
}
