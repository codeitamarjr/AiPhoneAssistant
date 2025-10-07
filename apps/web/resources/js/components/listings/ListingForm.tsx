import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import * as React from 'react';
import { router } from '@inertiajs/react';


type ListingFormProps = {
  action: string;
  method?: 'post' | 'put';
  defaults?: Partial<ListingPayload>;
  submitText?: string;
  phoneNumbers?: Array<{ id: number; phone_number: string; friendly_name?: string }>;
};

export type ListingPayload = {
  phone_number_id?: string | null;

  // Basic
  title: string;
  address?: string | null;
  postcode?: string | null;
  summary?: string | null;

  // Pricing & Lease
  rent: number | null;
  deposit?: number | null;
  available_from?: string | null; // yyyy-mm-dd
  min_lease_months?: number | null;

  // Property Details
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_area_sqm?: number | null;
  floor_number?: number | null;
  ber?: string | null;

  // Features
  furnished?: boolean;
  pets_allowed?: boolean;
  smoking_allowed?: boolean;
  parking?: string | null;
  heating?: string | null;

  // AI/meta
  amenities?: Record<string, any> | null;
  policies?: Record<string, any> | null;
  extra_info?: Record<string, any> | null;

  // Media & Status
  main_photo_path?: string | null;
  is_current?: boolean;
  is_published?: boolean;
};

export default function ListingForm({
  action,
  method = 'post',
  defaults,
  submitText = 'Save',
  phoneNumbers = [],
}: ListingFormProps) {
  const TArea =
    (Textarea as any) ??
    ((props: any) => (
      <textarea {...props} className="mt-1 block w-full rounded-md border p-2" />
    ));

  const {
    data,
    setData,
    post,
    put,
    processing,
    errors,
  } = useForm<Required<ListingPayload>>({
    // Basic
    phone_number_id: defaults?.phone_number_id ?? '',
    title: defaults?.title ?? '',
    address: defaults?.address ?? '',
    postcode: defaults?.postcode ?? '',
    summary: defaults?.summary ?? '',
    // Pricing & Lease
    rent:
      (defaults?.rent as any) ?? ('' as unknown as number), // allow empty
    deposit: (defaults?.deposit as any) ?? ('' as unknown as number),
    available_from: defaults?.available_from ?? '',
    min_lease_months:
      (defaults?.min_lease_months as any) ?? (12 as unknown as number),
    // Property Details
    bedrooms: (defaults?.bedrooms as any) ?? ('' as unknown as number),
    bathrooms: (defaults?.bathrooms as any) ?? ('' as unknown as number),
    floor_area_sqm: (defaults?.floor_area_sqm as any) ?? ('' as unknown as number),
    floor_number: (defaults?.floor_number as any) ?? ('' as unknown as number),
    ber: defaults?.ber ?? '',
    // Features
    furnished: defaults?.furnished ?? true,
    pets_allowed: defaults?.pets_allowed ?? false,
    smoking_allowed: defaults?.smoking_allowed ?? false,
    parking: defaults?.parking ?? '',
    heating: defaults?.heating ?? '',
    // AI/meta (we’ll send raw JSON strings; backend already parses/validates)
    amenities: (defaults?.amenities as any) ?? null,
    policies: (defaults?.policies as any) ?? null,
    extra_info: (defaults?.extra_info as any) ?? null,
    // Media & Status
    main_photo_path: defaults?.main_photo_path ?? '',
    is_current: defaults?.is_current ?? true,
    is_published: defaults?.is_published ?? false,
  });

  // Helpers for number inputs so empty -> '' (not 0), valid -> number
  const onNumber = (key: keyof ListingPayload) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setData(key as any, v === '' ? ('' as any) : (Number.isNaN(+v) ? ('' as any) : (+v as any)));
  };

  const onChange =
    (key: keyof ListingPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setData(key as any, e.target.value as any);

  const onCheck =
    (key: keyof ListingPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setData(key as any, e.target.checked as any);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    method === 'put' ? put(action) : post(action);
  };

  return (
    <div className="space-y-10">
      <HeadingSmall
        title="Listing details"
        description="Provide the information your assistant will use to answer callers."
      />

      {/* Single, top-level form to avoid nested form issues */}
      <form onSubmit={submit} className="space-y-10" noValidate>
        {/* Basic Info */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Basic Info
          </h3>

          <div className="grid gap-2 md:max-w-md">
            <Label htmlFor="phone_number_id">Phone Number</Label>
            <select
              id="phone_number_id"
              name="phone_number_id"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
              value={data.phone_number_id ?? ''}
              onChange={(e) =>
                setData('phone_number_id' as any, e.target.value === '' ? '' : String(e.target.value))
              }
            >
              <option value="">— Select a number —</option>
              {phoneNumbers.map((num) => (
                <option key={num.id} value={String(num.id)}>
                  {num.friendly_name || num.phone_number}
                </option>
              ))}
            </select>
            <InputError className="mt-2" message={(errors as any).phone_number_id} />
          </div>

          {phoneNumbers.length === 0 && (
            <div className="rounded-md border p-4 text-sm">
              <div className="mb-2 font-semibold">No phone numbers found</div>
              <p className="text-neutral-600">
                Add Twilio credentials to this workspace to sync numbers automatically.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              value={data.title}
              onChange={onChange('title')}
              placeholder="e.g. Bright 2-bed apartment in Dublin 8"
            />
            <InputError className="mt-2" message={(errors as any).title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              name="address"
              value={(data.address as any) ?? ''}
              onChange={onChange('address')}
              placeholder="Street, City"
            />
            <InputError className="mt-2" message={(errors as any).address} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="postcode">postcode</Label>
            <Input
              id="postcode"
              name="postcode"
              value={(data.postcode as any) ?? ''}
              onChange={onChange('postcode')}
              placeholder="D01 ABC1"
            />
            <InputError className="mt-2" message={(errors as any).postcode} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <TArea
              id="summary"
              name="summary"
              rows={4}
              value={(data.summary as any) ?? ''}
              onChange={onChange('summary')}
              placeholder="Short summary callers will hear first."
            />
            <InputError className="mt-2" message={(errors as any).summary} />
          </div>
        </section>

        {/* Pricing & Lease */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Pricing & Lease
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="rent">Monthly Rent (EUR)</Label>
              <Input
                id="rent"
                name="rent"
                type="number"
                min={0}
                value={(data.rent as any) ?? ''}
                onChange={onNumber('rent')}
              />
              <InputError className="mt-2" message={(errors as any).rent} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit">Deposit (EUR)</Label>
              <Input
                id="deposit"
                name="deposit"
                type="number"
                min={0}
                value={(data.deposit as any) ?? ''}
                onChange={onNumber('deposit')}
              />
              <InputError className="mt-2" message={(errors as any).deposit} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="available_from">Available from</Label>
              <Input
                id="available_from"
                name="available_from"
                type="date"
                value={(data.available_from as any) ?? ''}
                onChange={onChange('available_from')}
              />
              <InputError className="mt-2" message={(errors as any).available_from} />
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="min_lease_months">Minimum lease (months)</Label>
            <Input
              id="min_lease_months"
              name="min_lease_months"
              type="number"
              min={1}
              value={(data.min_lease_months as any) ?? 12}
              onChange={onNumber('min_lease_months')}
            />
            <InputError className="mt-2" message={(errors as any).min_lease_months} />
          </div>
        </section>

        {/* Property Details */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Property Details
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                min={0}
                value={(data.bedrooms as any) ?? ''}
                onChange={onNumber('bedrooms')}
              />
              <InputError className="mt-2" message={(errors as any).bedrooms} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                min={0}
                value={(data.bathrooms as any) ?? ''}
                onChange={onNumber('bathrooms')}
              />
              <InputError className="mt-2" message={(errors as any).bathrooms} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="floor_area_sqm">Floor area (sqm)</Label>
              <Input
                id="floor_area_sqm"
                name="floor_area_sqm"
                type="number"
                min={0}
                value={(data.floor_area_sqm as any) ?? ''}
                onChange={onNumber('floor_area_sqm')}
              />
              <InputError className="mt-2" message={(errors as any).floor_area_sqm} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="floor_number">Floor number</Label>
              <Input
                id="floor_number"
                name="floor_number"
                type="number"
                value={(data.floor_number as any) ?? ''}
                onChange={onNumber('floor_number')}
              />
              <InputError className="mt-2" message={(errors as any).floor_number} />
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="ber">BER (energy rating)</Label>
            <Input
              id="ber"
              name="ber"
              value={(data.ber as any) ?? ''}
              onChange={onChange('ber')}
              placeholder="e.g. B2"
            />
            <InputError className="mt-2" message={(errors as any).ber} />
          </div>
        </section>

        {/* Features */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Features
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <input
                id="furnished"
                name="furnished"
                type="checkbox"
                checked={!!data.furnished}
                onChange={onCheck('furnished')}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="furnished">Furnished</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="pets_allowed"
                name="pets_allowed"
                type="checkbox"
                checked={!!data.pets_allowed}
                onChange={onCheck('pets_allowed')}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="pets_allowed">Pets allowed</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="smoking_allowed"
                name="smoking_allowed"
                type="checkbox"
                checked={!!data.smoking_allowed}
                onChange={onCheck('smoking_allowed')}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="smoking_allowed">Smoking allowed</Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="parking">Parking</Label>
              <Input
                id="parking"
                name="parking"
                value={(data.parking as any) ?? ''}
                onChange={onChange('parking')}
                placeholder="On-street, permit, underground..."
              />
              <InputError className="mt-2" message={(errors as any).parking} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="heating">Heating</Label>
              <Input
                id="heating"
                name="heating"
                value={(data.heating as any) ?? ''}
                onChange={onChange('heating')}
                placeholder="Gas, electric, heat pump..."
              />
              <InputError className="mt-2" message={(errors as any).heating} />
            </div>
          </div>
        </section>

        {/* AI Meta */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            AI Meta (JSON)
          </h3>

          <div className="grid gap-2">
            <Label htmlFor="amenities">Amenities (JSON)</Label>
            <TArea
              id="amenities"
              name="amenities"
              rows={3}
              value={
                typeof data.amenities === 'string'
                  ? (data.amenities as any)
                  : data.amenities
                    ? JSON.stringify(data.amenities, null, 2)
                    : ''
              }
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setData('amenities' as any, e.target.value as any)
              }
              placeholder='e.g. {"wifi":true,"balcony":true,"dishwasher":true}'
            />
            <InputError className="mt-2" message={(errors as any).amenities} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="policies">Policies (JSON)</Label>
            <TArea
              id="policies"
              name="policies"
              rows={3}
              value={
                typeof data.policies === 'string'
                  ? (data.policies as any)
                  : data.policies
                    ? JSON.stringify(data.policies, null, 2)
                    : ''
              }
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setData('policies' as any, e.target.value as any)
              }
              placeholder='e.g. {"viewing":"By appointment","max_occupants":3}'
            />
            <InputError className="mt-2" message={(errors as any).policies} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extra_info">Extra info (JSON)</Label>
            <TArea
              id="extra_info"
              name="extra_info"
              rows={3}
              value={
                typeof data.extra_info === 'string'
                  ? (data.extra_info as any)
                  : data.extra_info
                    ? JSON.stringify(data.extra_info, null, 2)
                    : ''
              }
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setData('extra_info' as any, e.target.value as any)
              }
              placeholder="Any additional context your assistant can read"
            />
            <InputError className="mt-2" message={(errors as any).extra_info} />
          </div>
        </section>

        {/* Media & Status */}
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Media & Status
          </h3>

          <div className="grid gap-2">
            <Label htmlFor="main_photo_path">Main photo (path/URL)</Label>
            <Input
              id="main_photo_path"
              name="main_photo_path"
              value={(data.main_photo_path as any) ?? ''}
              onChange={onChange('main_photo_path')}
              placeholder="/storage/listings/abc.jpg or https://…"
            />
            <InputError className="mt-2" message={(errors as any).main_photo_path} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <input
                id="is_current"
                name="is_current"
                type="checkbox"
                checked={!!data.is_current}
                onChange={onCheck('is_current')}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="is_current">Current listing</Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_published"
                name="is_published"
                type="checkbox"
                checked={!!data.is_published}
                onChange={onCheck('is_published')}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="is_published">Published</Label>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={processing}>
            {submitText}
          </Button>
        </div>
      </form>
    </div>
  );
}
