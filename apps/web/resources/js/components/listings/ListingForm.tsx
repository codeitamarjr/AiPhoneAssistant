import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { Link, useForm } from '@inertiajs/react';
import React from 'react';

type InventoryScope = 'legacy' | 'unit' | 'unit_type' | 'collection';

type InventoryBuilding = {
  id: number;
  name: string;
  address_line1?: string | null;
  city?: string | null;
  postcode?: string | null;
};

type InventoryUnit = {
  id: number;
  identifier: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_area_sqm?: number | null;
  rent?: number | null;
  deposit?: number | null;
  available_from?: string | null;
  min_lease_months?: number | null;
  furnished?: boolean | null;
  pets_allowed?: boolean | null;
  smoking_allowed?: boolean | null;
  is_active?: boolean;
  building?: { id: number; name?: string | null } | null;
};

type InventoryUnitType = {
  id: number;
  name: string;
  description?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  floor_area_min_sqm?: number | null;
  floor_area_max_sqm?: number | null;
  default_rent?: number | null;
  default_deposit?: number | null;
  min_lease_months?: number | null;
  quantity_available?: number | null;
  quantity_total?: number | null;
  building?: { id: number; name?: string | null } | null;
};

export type InventoryPayload = {
  buildings: InventoryBuilding[];
  unitTypes: InventoryUnitType[];
  units: InventoryUnit[];
};

type ListingFormProps = {
  action: string;
  method?: 'post' | 'put';
  defaults?: Partial<ListingPayload> & { advertised_unit_ids?: Array<number | string> };
  submitText?: string;
  phoneNumbers?: Array<{ id: number; phone_number: string; friendly_name?: string }>;
  inventory: InventoryPayload;
};

export type ListingPayload = {
  inventory_scope: InventoryScope;
  unit_id: string;
  unit_type_id: string;
  advertised_unit_ids: string[];
  phone_number_id: string;
  title: string;
  address: string;
  postcode: string;
  summary: string;
  escalation_contact_name: string;
  escalation_contact_phone: string;
  rent: string;
  deposit: string;
  available_from: string;
  min_lease_months: string;
  bedrooms: string;
  bathrooms: string;
  floor_area_sqm: string;
  floor_number: string;
  ber: string;
  furnished: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  parking: string;
  heating: string;
  amenities: string;
  policies: string;
  extra_info: string;
  main_photo_path: string;
  is_current: boolean;
  is_published: boolean;
};

type ScopeOption = {
  value: InventoryScope;
  title: string;
  description: string;
};

const scopeOptions: ScopeOption[] = [
  {
    value: 'legacy',
    title: 'Custom listing',
    description: 'Keep all descriptive fields on the listing itself. Ideal for one-offs or historical records.',
  },
  {
    value: 'unit',
    title: 'Single unit',
    description: 'Advertise a specific home or apartment. Calls inherit details directly from that unit record.',
  },
  {
    value: 'unit_type',
    title: 'Unit type',
    description: 'Market a template (e.g. “1 bed · 45 sqm”). Great for bulk availability in the same building.',
  },
  {
    value: 'collection',
    title: 'Collection of units',
    description: 'Wrap several individual units in one campaign (e.g. “3 garden apartments ready now”).',
  },
];

const stringifyJson = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_) {
      return '';
    }
  }
  return '';
};

const TArea =
  (Textarea as any) ??
  ((props: any) => <textarea {...props} className="mt-1 block w-full rounded-md border p-2" />);

export default function ListingForm({
  action,
  method = 'post',
  defaults,
  submitText = 'Save',
  phoneNumbers = [],
  inventory,
}: ListingFormProps) {
  const initialScope = (defaults?.inventory_scope as InventoryScope) ?? 'legacy';

  const { data, setData, post, put, processing, errors } = useForm<ListingPayload>({
    inventory_scope: initialScope,
    unit_id: defaults?.unit_id != null ? String(defaults.unit_id) : '',
    unit_type_id: defaults?.unit_type_id != null ? String(defaults.unit_type_id) : '',
    advertised_unit_ids: (defaults?.advertised_unit_ids ?? []).map((id) => String(id)),
    phone_number_id: defaults?.phone_number_id ? String(defaults.phone_number_id) : '',
    title: defaults?.title ?? '',
    address: defaults?.address ?? '',
    postcode: defaults?.postcode ?? '',
    summary: defaults?.summary ?? '',
    escalation_contact_name: defaults?.escalation_contact_name ?? '',
    escalation_contact_phone: defaults?.escalation_contact_phone ?? '',
    rent: defaults?.rent != null ? String(defaults.rent) : '',
    deposit: defaults?.deposit != null ? String(defaults.deposit) : '',
    available_from: defaults?.available_from ?? '',
    min_lease_months: defaults?.min_lease_months != null ? String(defaults.min_lease_months) : '',
    bedrooms: defaults?.bedrooms != null ? String(defaults.bedrooms) : '',
    bathrooms: defaults?.bathrooms != null ? String(defaults.bathrooms) : '',
    floor_area_sqm: defaults?.floor_area_sqm != null ? String(defaults.floor_area_sqm) : '',
    floor_number: defaults?.floor_number != null ? String(defaults.floor_number) : '',
    ber: defaults?.ber ?? '',
    furnished: defaults?.furnished ?? true,
    pets_allowed: defaults?.pets_allowed ?? false,
    smoking_allowed: defaults?.smoking_allowed ?? false,
    parking: defaults?.parking ?? '',
    heating: defaults?.heating ?? '',
    amenities: stringifyJson(defaults?.amenities),
    policies: stringifyJson(defaults?.policies),
    extra_info: stringifyJson(defaults?.extra_info),
    main_photo_path: defaults?.main_photo_path ?? '',
    is_current: defaults?.is_current ?? true,
    is_published: defaults?.is_published ?? false,
  });

  const selectedUnit = React.useMemo(
    () => inventory.units.find((unit) => String(unit.id) === data.unit_id),
    [data.unit_id, inventory.units],
  );

  const selectedUnitType = React.useMemo(
    () => inventory.unitTypes.find((type) => String(type.id) === data.unit_type_id),
    [data.unit_type_id, inventory.unitTypes],
  );

  const collectionUnits = React.useMemo(
    () => inventory.units.filter((unit) => data.advertised_unit_ids.includes(String(unit.id))),
    [data.advertised_unit_ids, inventory.units],
  );

  const changeScope = (scope: InventoryScope) => {
    setData('inventory_scope', scope);
    if (scope === 'legacy') {
      setData('unit_id', '');
      setData('unit_type_id', '');
      setData('advertised_unit_ids', []);
    }
    if (scope === 'unit') {
      setData('unit_type_id', '');
      setData('advertised_unit_ids', []);
    }
    if (scope === 'unit_type') {
      setData('unit_id', '');
      setData('advertised_unit_ids', []);
    }
    if (scope === 'collection') {
      setData('unit_id', '');
      setData('unit_type_id', '');
    }
  };

  const onNumber = (key: keyof ListingPayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setData(key, event.target.value);
  };

  const onChange =
    (key: keyof ListingPayload) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setData(key, event.target.value);
    };

  const onCheck = (key: keyof ListingPayload) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setData(key, event.target.checked as any);
  };

  const onPhoneNumberChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setData('phone_number_id', event.target.value);
  };

  const onUnitChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setData('unit_id', event.target.value);
  };

  const onUnitTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setData('unit_type_id', event.target.value);
  };

  const onCollectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(event.target.selectedOptions).map((opt) => opt.value);
    setData('advertised_unit_ids', options);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    method === 'put' ? put(action) : post(action);
  };

  return (
    <div className="space-y-10">
      <HeadingSmall
        title="Listing details"
        description="Choose which inventory this listing advertises, then override any marketing copy you need."
      />

      <form onSubmit={submit} className="space-y-10" noValidate>
        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Phone & title
          </h3>

          <div className="grid gap-2 md:max-w-md">
            <Label htmlFor="phone_number_id">Phone Number</Label>
            <select
              id="phone_number_id"
              name="phone_number_id"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
              value={data.phone_number_id}
              onChange={onPhoneNumberChange}
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

          <div className="grid gap-4 md:max-w-2xl md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="escalation_contact_name">Escalation contact name</Label>
              <Input
                id="escalation_contact_name"
                name="escalation_contact_name"
                value={data.escalation_contact_name}
                onChange={onChange('escalation_contact_name')}
                placeholder="Lettings manager"
              />
              <InputError className="mt-2" message={(errors as any).escalation_contact_name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="escalation_contact_phone">Escalation contact phone</Label>
              <Input
                id="escalation_contact_phone"
                name="escalation_contact_phone"
                value={data.escalation_contact_phone}
                onChange={onChange('escalation_contact_phone')}
                placeholder="+353 1 555 0123"
                autoComplete="tel"
              />
              <InputError className="mt-2" message={(errors as any).escalation_contact_phone} />
            </div>
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
            <Label htmlFor="title">Listing title *</Label>
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
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
              Inventory source
            </h3>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <Link className="underline" href="/inventory/buildings">Manage buildings</Link>
              <Link className="underline" href="/inventory/units">Manage units</Link>
              <Link className="underline" href="/inventory/unit-types">Manage unit types</Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {scopeOptions.map((option) => {
              const selected = data.inventory_scope === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-4 transition ${
                    selected ? 'border-primary bg-primary/5' : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="inventory_scope"
                      value={option.value}
                      checked={selected}
                      onChange={() => changeScope(option.value)}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">{option.title}</div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">{option.description}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <InputError className="mt-2" message={(errors as any).inventory_scope} />

          {data.inventory_scope === 'unit' && (
            <div className="space-y-3 rounded-lg border border-dashed border-neutral-300 p-4">
              <div className="grid gap-2 md:max-w-xl">
                <Label htmlFor="unit_id">Select unit</Label>
                <select
                  id="unit_id"
                  name="unit_id"
                  value={data.unit_id}
                  onChange={onUnitChange}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="">— Choose a unit —</option>
                  {inventory.units.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {unit.identifier}
                      {unit.building?.name ? ` · ${unit.building.name}` : ''}
                    </option>
                  ))}
                </select>
                <InputError className="mt-2" message={(errors as any).unit_id} />
              </div>

              {selectedUnit ? (
                <div className="rounded-md bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUnit.bedrooms != null && (
                      <Badge variant="secondary">{selectedUnit.bedrooms} bed</Badge>
                    )}
                    {selectedUnit.bathrooms != null && (
                      <Badge variant="secondary">{selectedUnit.bathrooms} bath</Badge>
                    )}
                    {selectedUnit.floor_area_sqm != null && (
                      <Badge variant="secondary">{selectedUnit.floor_area_sqm} sqm</Badge>
                    )}
                    {selectedUnit.rent != null && (
                      <Badge variant="outline">€{selectedUnit.rent}</Badge>
                    )}
                    {selectedUnit.available_from && (
                      <Badge variant="outline">From {new Date(selectedUnit.available_from).toLocaleDateString()}</Badge>
                    )}
                  </div>
                  {selectedUnit.building?.name && (
                    <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                      Building: {selectedUnit.building.name}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Need a new unit? <Link className="underline" href="/inventory/units">Add one here.</Link>
                </p>
              )}
            </div>
          )}

          {data.inventory_scope === 'unit_type' && (
            <div className="space-y-3 rounded-lg border border-dashed border-neutral-300 p-4">
              <div className="grid gap-2 md:max-w-xl">
                <Label htmlFor="unit_type_id">Select unit type</Label>
                <select
                  id="unit_type_id"
                  name="unit_type_id"
                  value={data.unit_type_id}
                  onChange={onUnitTypeChange}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
                >
                  <option value="">— Choose a unit type —</option>
                  {inventory.unitTypes.map((type) => (
                    <option key={type.id} value={String(type.id)}>
                      {type.name}
                      {type.building?.name ? ` · ${type.building.name}` : ''}
                    </option>
                  ))}
                </select>
                <InputError className="mt-2" message={(errors as any).unit_type_id} />
              </div>

              {selectedUnitType ? (
                <div className="rounded-md bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUnitType.bedrooms != null && (
                      <Badge variant="secondary">{selectedUnitType.bedrooms} bed</Badge>
                    )}
                    {selectedUnitType.bathrooms != null && (
                      <Badge variant="secondary">{selectedUnitType.bathrooms} bath</Badge>
                    )}
                    {(selectedUnitType.floor_area_min_sqm != null || selectedUnitType.floor_area_max_sqm != null) && (
                      <Badge variant="secondary">
                        {selectedUnitType.floor_area_min_sqm ?? '—'}–{selectedUnitType.floor_area_max_sqm ?? '—'} sqm
                      </Badge>
                    )}
                    {selectedUnitType.default_rent != null && (
                      <Badge variant="outline">€{selectedUnitType.default_rent}</Badge>
                    )}
                  </div>
                  {selectedUnitType.description && (
                    <p className="mt-2 text-neutral-600 dark:text-neutral-300">{selectedUnitType.description}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Need a new template? <Link className="underline" href="/inventory/unit-types">Create one.</Link>
                </p>
              )}
            </div>
          )}

          {data.inventory_scope === 'collection' && (
            <div className="space-y-3 rounded-lg border border-dashed border-neutral-300 p-4">
              <div className="grid gap-2 md:max-w-xl">
                <Label htmlFor="advertised_unit_ids">Pick units for this collection</Label>
                <select
                  id="advertised_unit_ids"
                  name="advertised_unit_ids"
                  multiple
                  value={data.advertised_unit_ids}
                  onChange={onCollectionChange}
                  className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
                  size={Math.min(8, Math.max(3, inventory.units.length))}
                >
                  {inventory.units.map((unit) => (
                    <option key={unit.id} value={String(unit.id)}>
                      {unit.identifier}
                      {unit.building?.name ? ` · ${unit.building.name}` : ''}
                    </option>
                  ))}
                </select>
                <InputError className="mt-2" message={(errors as any).advertised_unit_ids} />
              </div>

              {collectionUnits.length > 0 ? (
                <div className="space-y-3 text-sm">
                  {collectionUnits.map((unit) => (
                    <div key={unit.id} className="rounded-md bg-neutral-50 p-3 dark:bg-neutral-900">
                      <div className="font-medium">{unit.identifier}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {unit.bedrooms != null && <span>{unit.bedrooms} bed</span>}
                        {unit.bathrooms != null && <span>{unit.bathrooms} bath</span>}
                        {unit.rent != null && <span>€{unit.rent}</span>}
                        {unit.available_from && (
                          <span>from {new Date(unit.available_from).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Select one or more units. <Link className="underline" href="/inventory/units">Manage units</Link> to add
                  more inventory.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Address & summary
          </h3>

          <p className="text-sm text-neutral-500">
            When you link a unit or unit type we automatically fall back to their address and amenities. Override them here
            if you need bespoke marketing copy.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="address">Address {data.inventory_scope === 'legacy' ? '*' : '(optional override)'}</Label>
            <Input
              id="address"
              name="address"
              value={data.address}
              onChange={onChange('address')}
              placeholder="Street, City"
            />
            <InputError className="mt-2" message={(errors as any).address} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="postcode">Postcode</Label>
            <Input
              id="postcode"
              name="postcode"
              value={data.postcode}
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
              value={data.summary}
              onChange={onChange('summary')}
              placeholder="Short summary callers will hear first."
            />
            <InputError className="mt-2" message={(errors as any).summary} />
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Pricing & lease
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="rent">Monthly rent (EUR)</Label>
              <Input id="rent" name="rent" type="number" min={0} value={data.rent} onChange={onNumber('rent')} />
              <InputError className="mt-2" message={(errors as any).rent} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit">Deposit (EUR)</Label>
              <Input id="deposit" name="deposit" type="number" min={0} value={data.deposit} onChange={onNumber('deposit')} />
              <InputError className="mt-2" message={(errors as any).deposit} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="available_from">Available from</Label>
              <Input
                id="available_from"
                name="available_from"
                type="date"
                value={data.available_from}
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
              value={data.min_lease_months}
              onChange={onNumber('min_lease_months')}
            />
            <InputError className="mt-2" message={(errors as any).min_lease_months} />
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">
            Property details
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input id="bedrooms" name="bedrooms" type="number" min={0} value={data.bedrooms} onChange={onNumber('bedrooms')} />
              <InputError className="mt-2" message={(errors as any).bedrooms} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Input id="bathrooms" name="bathrooms" type="number" min={0} value={data.bathrooms} onChange={onNumber('bathrooms')} />
              <InputError className="mt-2" message={(errors as any).bathrooms} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="floor_area_sqm">Floor area (sqm)</Label>
              <Input
                id="floor_area_sqm"
                name="floor_area_sqm"
                type="number"
                min={0}
                value={data.floor_area_sqm}
                onChange={onNumber('floor_area_sqm')}
              />
              <InputError className="mt-2" message={(errors as any).floor_area_sqm} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="floor_number">Floor number</Label>
              <Input id="floor_number" name="floor_number" type="number" value={data.floor_number} onChange={onNumber('floor_number')} />
              <InputError className="mt-2" message={(errors as any).floor_number} />
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="ber">BER (energy rating)</Label>
            <Input id="ber" name="ber" value={data.ber} onChange={onChange('ber')} placeholder="e.g. B2" />
            <InputError className="mt-2" message={(errors as any).ber} />
          </div>
        </section>

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
              <Input id="parking" name="parking" value={data.parking} onChange={onChange('parking')} placeholder="Allocated space" />
              <InputError className="mt-2" message={(errors as any).parking} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heating">Heating</Label>
              <Input id="heating" name="heating" value={data.heating} onChange={onChange('heating')} placeholder="Gas / Electric" />
              <InputError className="mt-2" message={(errors as any).heating} />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">AI meta (JSON)</h3>

          <div className="grid gap-2">
            <Label htmlFor="amenities">Amenities</Label>
            <TArea
              id="amenities"
              name="amenities"
              rows={3}
              value={data.amenities}
              onChange={onChange('amenities')}
              placeholder='e.g. {"wifi":true,"balcony":true,"dishwasher":true}'
            />
            <InputError className="mt-2" message={(errors as any).amenities} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="policies">Policies</Label>
            <TArea
              id="policies"
              name="policies"
              rows={3}
              value={data.policies}
              onChange={onChange('policies')}
              placeholder='e.g. {"viewing":"By appointment","max_occupants":3}'
            />
            <InputError className="mt-2" message={(errors as any).policies} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="extra_info">Extra info</Label>
            <TArea
              id="extra_info"
              name="extra_info"
              rows={3}
              value={data.extra_info}
              onChange={onChange('extra_info')}
              placeholder="Any additional context your assistant can read"
            />
            <InputError className="mt-2" message={(errors as any).extra_info} />
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-sm font-semibold uppercase text-neutral-600 dark:text-neutral-300">Media & status</h3>

          <div className="grid gap-2">
            <Label htmlFor="main_photo_path">Main photo (path or URL)</Label>
            <Input
              id="main_photo_path"
              name="main_photo_path"
              value={data.main_photo_path}
              onChange={onChange('main_photo_path')}
              placeholder="/storage/listings/abc.jpg"
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
              <Label htmlFor="is_current">Current</Label>
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
