import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import React from 'react';

export type UnitPayload = {
  building_id: string;
  unit_type_id: string;
  identifier: string;
  address_line1: string;
  address_line2: string;
  city: string;
  county: string;
  postcode: string;
  bedrooms: string;
  bathrooms: string;
  floor_area_sqm: string;
  floor_number: string;
  ber: string;
  furnished: boolean;
  pets_allowed: boolean;
  smoking_allowed: boolean;
  rent: string;
  deposit: string;
  available_from: string;
  min_lease_months: string;
  parking: string;
  heating: string;
  amenities: string;
  policies: string;
  extra_info: string;
  is_active: boolean;
};

type BuildingOption = { id: number; name: string };
type UnitTypeOption = { id: number; name: string; building_id?: number | null };

type UnitFormProps = {
  action: string;
  method?: 'post' | 'put';
  defaults?: Partial<UnitPayload>;
  submitText?: string;
  buildings: BuildingOption[];
  unitTypes: UnitTypeOption[];
};

const TArea =
  (Textarea as any) ??
  ((props: any) => <textarea {...props} className="mt-1 block w-full rounded-md border p-2" />);

const stringifyJson = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (_) {
      return '';
    }
  }
  return '';
};

export default function UnitForm({ action, method = 'post', defaults, submitText = 'Save', buildings, unitTypes }: UnitFormProps) {
  const { data, setData, post, put, processing, errors } = useForm<UnitPayload>({
    building_id: defaults?.building_id ?? '',
    unit_type_id: defaults?.unit_type_id ?? '',
    identifier: defaults?.identifier ?? '',
    address_line1: defaults?.address_line1 ?? '',
    address_line2: defaults?.address_line2 ?? '',
    city: defaults?.city ?? '',
    county: defaults?.county ?? '',
    postcode: defaults?.postcode ?? '',
    bedrooms: defaults?.bedrooms ?? '',
    bathrooms: defaults?.bathrooms ?? '',
    floor_area_sqm: defaults?.floor_area_sqm ?? '',
    floor_number: defaults?.floor_number ?? '',
    ber: defaults?.ber ?? '',
    furnished: defaults?.furnished ?? true,
    pets_allowed: defaults?.pets_allowed ?? false,
    smoking_allowed: defaults?.smoking_allowed ?? false,
    rent: defaults?.rent ?? '',
    deposit: defaults?.deposit ?? '',
    available_from: defaults?.available_from ?? '',
    min_lease_months: defaults?.min_lease_months ?? '',
    parking: defaults?.parking ?? '',
    heating: defaults?.heating ?? '',
    amenities: stringifyJson(defaults?.amenities),
    policies: stringifyJson(defaults?.policies),
    extra_info: stringifyJson(defaults?.extra_info),
    is_active: defaults?.is_active ?? true,
  });

  const filteredUnitTypes = React.useMemo(() => {
    if (!data.building_id) {
      return unitTypes;
    }
    return unitTypes.filter((type) => !type.building_id || String(type.building_id) === data.building_id);
  }, [data.building_id, unitTypes]);

  const onField = (key: keyof UnitPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setData(key, e.target.value as any);

  const onCheck = (key: keyof UnitPayload) => (e: React.ChangeEvent<HTMLInputElement>) => setData(key, e.target.checked as any);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    method === 'put' ? put(action) : post(action);
  };

  React.useEffect(() => {
    if (data.unit_type_id && !filteredUnitTypes.find((t) => String(t.id) === data.unit_type_id)) {
      setData('unit_type_id', '');
    }
  }, [data.building_id, data.unit_type_id, filteredUnitTypes, setData]);

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="building_id">Building</Label>
          <select
            id="building_id"
            name="building_id"
            value={data.building_id}
            onChange={onField('building_id')}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">— Standalone / not in a building —</option>
            {buildings.map((building) => (
              <option key={building.id} value={String(building.id)}>
                {building.name}
              </option>
            ))}
          </select>
          <InputError className="mt-2" message={(errors as any).building_id} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="unit_type_id">Unit type</Label>
          <select
            id="unit_type_id"
            name="unit_type_id"
            value={data.unit_type_id}
            onChange={onField('unit_type_id')}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">— None / custom —</option>
            {filteredUnitTypes.map((type) => (
              <option key={type.id} value={String(type.id)}>
                {type.name}
              </option>
            ))}
          </select>
          <InputError className="mt-2" message={(errors as any).unit_type_id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="identifier">Identifier</Label>
          <Input id="identifier" name="identifier" value={data.identifier} onChange={onField('identifier')} placeholder="e.g. Apt 3B" />
          <InputError className="mt-2" message={(errors as any).identifier} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="available_from">Available from</Label>
          <Input id="available_from" name="available_from" type="date" value={data.available_from} onChange={onField('available_from')} />
          <InputError className="mt-2" message={(errors as any).available_from} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="address_line1">Address line 1</Label>
          <Input id="address_line1" name="address_line1" value={data.address_line1} onChange={onField('address_line1')} />
          <InputError className="mt-2" message={(errors as any).address_line1} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address_line2">Address line 2</Label>
          <Input id="address_line2" name="address_line2" value={data.address_line2} onChange={onField('address_line2')} />
          <InputError className="mt-2" message={(errors as any).address_line2} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={data.city} onChange={onField('city')} />
          <InputError className="mt-2" message={(errors as any).city} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="county">County</Label>
          <Input id="county" name="county" value={data.county} onChange={onField('county')} />
          <InputError className="mt-2" message={(errors as any).county} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" value={data.postcode} onChange={onField('postcode')} />
          <InputError className="mt-2" message={(errors as any).postcode} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" name="bedrooms" type="number" min={0} value={data.bedrooms} onChange={onField('bedrooms')} />
          <InputError className="mt-2" message={(errors as any).bedrooms} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" name="bathrooms" type="number" min={0} value={data.bathrooms} onChange={onField('bathrooms')} />
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
            onChange={onField('floor_area_sqm')}
          />
          <InputError className="mt-2" message={(errors as any).floor_area_sqm} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="floor_number">Floor number</Label>
          <Input id="floor_number" name="floor_number" type="number" value={data.floor_number} onChange={onField('floor_number')} />
          <InputError className="mt-2" message={(errors as any).floor_number} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="rent">Rent (EUR)</Label>
          <Input id="rent" name="rent" type="number" min={0} value={data.rent} onChange={onField('rent')} />
          <InputError className="mt-2" message={(errors as any).rent} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="deposit">Deposit (EUR)</Label>
          <Input id="deposit" name="deposit" type="number" min={0} value={data.deposit} onChange={onField('deposit')} />
          <InputError className="mt-2" message={(errors as any).deposit} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="min_lease_months">Min lease (months)</Label>
          <Input
            id="min_lease_months"
            name="min_lease_months"
            type="number"
            min={1}
            value={data.min_lease_months}
            onChange={onField('min_lease_months')}
          />
          <InputError className="mt-2" message={(errors as any).min_lease_months} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="ber">BER</Label>
          <Input id="ber" name="ber" value={data.ber} onChange={onField('ber')} placeholder="e.g. B2" />
          <InputError className="mt-2" message={(errors as any).ber} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="parking">Parking</Label>
          <Input id="parking" name="parking" value={data.parking} onChange={onField('parking')} placeholder="Allocated / none" />
          <InputError className="mt-2" message={(errors as any).parking} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="heating">Heating</Label>
          <Input id="heating" name="heating" value={data.heating} onChange={onField('heating')} placeholder="e.g. Gas" />
          <InputError className="mt-2" message={(errors as any).heating} />
        </div>
      </div>

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-center gap-2">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            checked={!!data.is_active}
            onChange={onCheck('is_active')}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <Label htmlFor="is_active">Active inventory</Label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2 md:col-span-1 md:col-start-1 md:row-span-1">
          <Label htmlFor="amenities">Amenities (JSON)</Label>
          <TArea id="amenities" name="amenities" rows={3} value={data.amenities} onChange={onField('amenities')} />
          <InputError className="mt-2" message={(errors as any).amenities} />
        </div>
        <div className="grid gap-2 md:col-span-1 md:row-span-1">
          <Label htmlFor="policies">Policies (JSON)</Label>
          <TArea id="policies" name="policies" rows={3} value={data.policies} onChange={onField('policies')} />
          <InputError className="mt-2" message={(errors as any).policies} />
        </div>
        <div className="grid gap-2 md:col-span-1 md:row-span-1">
          <Label htmlFor="extra_info">Extra info (JSON)</Label>
          <TArea id="extra_info" name="extra_info" rows={3} value={data.extra_info} onChange={onField('extra_info')} />
          <InputError className="mt-2" message={(errors as any).extra_info} />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={processing}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
