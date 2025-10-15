import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import React from 'react';

export type UnitTypePayload = {
  building_id: string;
  name: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  floor_area_min_sqm: string;
  floor_area_max_sqm: string;
  default_rent: string;
  default_deposit: string;
  min_lease_months: string;
  quantity_total: string;
  quantity_available: string;
  amenities: string;
  policies: string;
};

type BuildingOption = { id: number; name: string };

type UnitTypeFormProps = {
  action: string;
  method?: 'post' | 'put';
  defaults?: Partial<UnitTypePayload>;
  submitText?: string;
  buildings: BuildingOption[];
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

export default function UnitTypeForm({ action, method = 'post', defaults, submitText = 'Save', buildings }: UnitTypeFormProps) {
  const { data, setData, post, put, processing, errors } = useForm<UnitTypePayload>({
    building_id: defaults?.building_id ?? '',
    name: defaults?.name ?? '',
    description: defaults?.description ?? '',
    bedrooms: defaults?.bedrooms ?? '',
    bathrooms: defaults?.bathrooms ?? '',
    floor_area_min_sqm: defaults?.floor_area_min_sqm ?? '',
    floor_area_max_sqm: defaults?.floor_area_max_sqm ?? '',
    default_rent: defaults?.default_rent ?? '',
    default_deposit: defaults?.default_deposit ?? '',
    min_lease_months: defaults?.min_lease_months ?? '',
    quantity_total: defaults?.quantity_total ?? '',
    quantity_available: defaults?.quantity_available ?? '',
    amenities: stringifyJson(defaults?.amenities),
    policies: stringifyJson(defaults?.policies),
  });

  const onChange = (key: keyof UnitTypePayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setData(key, e.target.value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    method === 'put' ? put(action) : post(action);
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="building_id">Building *</Label>
          <select
            id="building_id"
            name="building_id"
            required
            value={data.building_id}
            onChange={onChange('building_id')}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2"
          >
            <option value="">— Select building —</option>
            {buildings.map((building) => (
              <option key={building.id} value={String(building.id)}>
                {building.name}
              </option>
            ))}
          </select>
          <InputError className="mt-2" message={(errors as any).building_id} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name">Unit type *</Label>
          <Input id="name" name="name" required value={data.name} onChange={onChange('name')} placeholder="e.g. 1 bed deluxe" />
          <InputError className="mt-2" message={(errors as any).name} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <TArea id="description" name="description" rows={3} value={data.description} onChange={onChange('description')} />
        <InputError className="mt-2" message={(errors as any).description} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="bedrooms">Bedrooms</Label>
          <Input id="bedrooms" name="bedrooms" type="number" min={0} value={data.bedrooms} onChange={onChange('bedrooms')} />
          <InputError className="mt-2" message={(errors as any).bedrooms} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="bathrooms">Bathrooms</Label>
          <Input id="bathrooms" name="bathrooms" type="number" min={0} value={data.bathrooms} onChange={onChange('bathrooms')} />
          <InputError className="mt-2" message={(errors as any).bathrooms} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="min_lease_months">Min lease (months)</Label>
          <Input
            id="min_lease_months"
            name="min_lease_months"
            type="number"
            min={1}
            value={data.min_lease_months}
            onChange={onChange('min_lease_months')}
          />
          <InputError className="mt-2" message={(errors as any).min_lease_months} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="floor_area_min_sqm">Floor area min (sqm)</Label>
          <Input
            id="floor_area_min_sqm"
            name="floor_area_min_sqm"
            type="number"
            min={0}
            value={data.floor_area_min_sqm}
            onChange={onChange('floor_area_min_sqm')}
          />
          <InputError className="mt-2" message={(errors as any).floor_area_min_sqm} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="floor_area_max_sqm">Floor area max (sqm)</Label>
          <Input
            id="floor_area_max_sqm"
            name="floor_area_max_sqm"
            type="number"
            min={0}
            value={data.floor_area_max_sqm}
            onChange={onChange('floor_area_max_sqm')}
          />
          <InputError className="mt-2" message={(errors as any).floor_area_max_sqm} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="default_rent">Default rent (EUR)</Label>
          <Input id="default_rent" name="default_rent" type="number" min={0} value={data.default_rent} onChange={onChange('default_rent')} />
          <InputError className="mt-2" message={(errors as any).default_rent} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="default_deposit">Default deposit (EUR)</Label>
          <Input id="default_deposit" name="default_deposit" type="number" min={0} value={data.default_deposit} onChange={onChange('default_deposit')} />
          <InputError className="mt-2" message={(errors as any).default_deposit} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="quantity_total">Total count</Label>
          <Input id="quantity_total" name="quantity_total" type="number" min={0} value={data.quantity_total} onChange={onChange('quantity_total')} />
          <InputError className="mt-2" message={(errors as any).quantity_total} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="quantity_available">Available count</Label>
          <Input
            id="quantity_available"
            name="quantity_available"
            type="number"
            min={0}
            value={data.quantity_available}
            onChange={onChange('quantity_available')}
          />
          <InputError className="mt-2" message={(errors as any).quantity_available} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="amenities">Amenities (JSON)</Label>
          <TArea id="amenities" name="amenities" rows={3} value={data.amenities} onChange={onChange('amenities')} />
          <InputError className="mt-2" message={(errors as any).amenities} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="policies">Policies (JSON)</Label>
        <TArea id="policies" name="policies" rows={3} value={data.policies} onChange={onChange('policies')} />
        <InputError className="mt-2" message={(errors as any).policies} />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={processing}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
