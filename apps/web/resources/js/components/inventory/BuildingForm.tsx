import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import React from 'react';

export type BuildingPayload = {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  county: string;
  postcode: string;
  latitude: string;
  longitude: string;
  parking: string;
  heating: string;
  amenities: string;
  policies: string;
  notes: string;
};

type BuildingFormProps = {
  action: string;
  method?: 'post' | 'put';
  defaults?: Partial<BuildingPayload>;
  submitText?: string;
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

export default function BuildingForm({ action, method = 'post', defaults, submitText = 'Save' }: BuildingFormProps) {
  const { data, setData, post, put, processing, errors } = useForm<BuildingPayload>({
    name: defaults?.name ?? '',
    address_line1: defaults?.address_line1 ?? '',
    address_line2: defaults?.address_line2 ?? '',
    city: defaults?.city ?? '',
    county: defaults?.county ?? '',
    postcode: defaults?.postcode ?? '',
    latitude: defaults?.latitude ?? '',
    longitude: defaults?.longitude ?? '',
    parking: defaults?.parking ?? '',
    heating: defaults?.heating ?? '',
    amenities: stringifyJson(defaults?.amenities),
    policies: stringifyJson(defaults?.policies),
    notes: defaults?.notes ?? '',
  });

  const onChange = (key: keyof BuildingPayload) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setData(key, e.target.value);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    method === 'put' ? put(action) : post(action);
  };

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Building name</Label>
          <Input id="name" name="name" value={data.name} onChange={onChange('name')} placeholder="Optional e.g. Birch House" />
          <InputError className="mt-2" message={(errors as any).name} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address_line1">Address line 1 *</Label>
          <Input
            id="address_line1"
            name="address_line1"
            required
            value={data.address_line1}
            onChange={onChange('address_line1')}
            placeholder="Primary street address"
          />
          <InputError className="mt-2" message={(errors as any).address_line1} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="address_line2">Address line 2</Label>
          <Input id="address_line2" name="address_line2" value={data.address_line2} onChange={onChange('address_line2')} />
          <InputError className="mt-2" message={(errors as any).address_line2} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" value={data.city} onChange={onChange('city')} />
          <InputError className="mt-2" message={(errors as any).city} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="county">County</Label>
          <Input id="county" name="county" value={data.county} onChange={onChange('county')} />
          <InputError className="mt-2" message={(errors as any).county} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" name="postcode" value={data.postcode} onChange={onChange('postcode')} />
          <InputError className="mt-2" message={(errors as any).postcode} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="parking">Parking</Label>
          <Input id="parking" name="parking" value={data.parking} onChange={onChange('parking')} placeholder="Underground, on-street…" />
          <InputError className="mt-2" message={(errors as any).parking} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="heating">Heating</Label>
          <Input id="heating" name="heating" value={data.heating} onChange={onChange('heating')} placeholder="e.g. Gas central" />
          <InputError className="mt-2" message={(errors as any).heating} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" value={data.latitude} onChange={onChange('latitude')} placeholder="52.1234" />
          <InputError className="mt-2" message={(errors as any).latitude} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" name="longitude" value={data.longitude} onChange={onChange('longitude')} placeholder="-8.4321" />
          <InputError className="mt-2" message={(errors as any).longitude} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="amenities">Shared amenities (JSON)</Label>
          <TArea id="amenities" name="amenities" rows={4} value={data.amenities} onChange={onChange('amenities')} placeholder='{"gym":true,"concierge":true}' />
          <InputError className="mt-2" message={(errors as any).amenities} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="policies">Policies (JSON)</Label>
          <TArea id="policies" name="policies" rows={4} value={data.policies} onChange={onChange('policies')} placeholder='{"viewing":"By appointment"}' />
          <InputError className="mt-2" message={(errors as any).policies} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Internal notes</Label>
        <TArea id="notes" name="notes" rows={4} value={data.notes} onChange={onChange('notes')} placeholder="Optional private notes" />
        <InputError className="mt-2" message={(errors as any).notes} />
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={processing}>
          {submitText}
        </Button>
      </div>
    </form>
  );
}
