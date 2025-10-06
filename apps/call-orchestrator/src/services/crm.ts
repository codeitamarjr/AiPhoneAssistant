import { env } from '../config/env';
import { logger } from '../config/logger';

type ApiListing = {
  id: number;
  title: string;
  address: string;
  eircode: string;
  summary: string | null;
  monthly_rent_eur: number | null;
  deposit_eur: number | null;
  available_from: string | null; // ISO date
  min_lease_months: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor_area_sqm: number | null;
  floor_number: number | null;
  ber: string | null;
  furnished: boolean | null;
  pets_allowed: boolean | null;
  smoking_allowed: boolean | null;
  parking: string | null;
  heating: string | null;
  amenities?: string[] | string | null;
  policies?: string[] | string | null;
  extra_info?: string | null;
};

export type OrchestratorListing = {
  id: number;
  title: string;
  address: string;
  price: number | null;
  beds: number | null;
  baths: number | null;
  features: string[];
  viewing_notes?: string;
  contact_policy?: string;
};

function toArray(maybe: string[] | string | null | undefined): string[] {
  if (!maybe) return [];
  if (Array.isArray(maybe)) return maybe.filter(Boolean);
  // comma or semicolon separated
  return maybe.split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

function normalizeListing(api: ApiListing): OrchestratorListing {
  const feats: string[] = [];
  if (api.ber) feats.push(`BER ${api.ber}`);
  if (api.furnished != null) feats.push(api.furnished ? 'Furnished' : 'Unfurnished');
  if (api.pets_allowed != null) feats.push(api.pets_allowed ? 'Pets allowed' : 'No pets');
  if (api.smoking_allowed != null) feats.push(api.smoking_allowed ? 'Smoking allowed' : 'No smoking');
  if (api.floor_area_sqm) feats.push(`${api.floor_area_sqm} sqm`);
  if (api.floor_number != null) feats.push(`Floor ${api.floor_number}`);
  feats.push(...toArray(api.amenities));
  feats.push(...toArray(api.policies));

  return {
    id: api.id,
    title: api.title,
    address: api.address,
    price: api.monthly_rent_eur ?? null,
    beds: api.bedrooms ?? null,
    baths: api.bathrooms ?? null,
    features: feats.slice(0, 12),
    viewing_notes: undefined,
    contact_policy: undefined,
  };
}

async function post(path: string, body: any) {
  const url = `${env.WEB_API_BASE_URL}/api${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.API_TOKEN}`,
      'X-Api-Token': env.API_TOKEN,
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();

  if (!res.ok) {
    logger.error({ path, status: res.status, ct, preview: text.slice(0, 400) }, 'Laravel API error');
    throw new Error(`Laravel API error ${res.status}`);
  }
  if (!/application\/json/i.test(ct)) {
    logger.error({ path, ct, preview: text.slice(0, 200) }, 'Laravel API returned non-JSON');
    throw new Error('Laravel API returned non-JSON');
  }
  return JSON.parse(text);
}

export function logCallStart(p: {
  callSid: string; from: string; to: string; callerName?: string; meta?: any;
}) {
  return post('/calls/start', {
    group_id: env.GROUP_ID,
    twilio_call_sid: p.callSid,
    from_e164: p.from,
    to_e164: p.to,
    caller_name: p.callerName ?? null,
    status: 'in-progress',
    started_at: new Date().toISOString(),
    meta: p.meta ?? { source: 'voice-webhook' },
  });
}

export function logCallEnd(p: {
  callSid: string; status: string; durationSeconds?: number; callerName?: string; meta?: any;
}) {
  return post('/calls/end', {
    twilio_call_sid: p.callSid,
    status: p.status,
    ended_at: new Date().toISOString(),
    duration_seconds: p.durationSeconds ?? null,
    caller_name: p.callerName ?? null,
    meta: p.meta ?? { source: 'media-stream' },
  });
}

export async function fetchActiveListing(groupId: number) {
  const url = `${env.WEB_API_BASE_URL}/api/listings/current?group_id=${groupId}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.API_TOKEN}`,
      'X-Api-Token': env.API_TOKEN,
      'Accept': 'application/json',
    },
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error({ url, status: res.status, preview: text.slice(0, 200) }, 'fetchActiveListing failed');
    return null;
  }
  try {
    const apiListing: ApiListing = JSON.parse(text);
    if (!apiListing || !apiListing.id) return null;
    return normalizeListing(apiListing);
  } catch {
    logger.error({ url, preview: text.slice(0, 200) }, 'fetchActiveListing non-JSON');
    return null;
  }
}

export async function createLead(body: {
  group_id: number; listing_id?: number | null; call_log_id?: number | null;
  name?: string | null; phone_e164: string; email?: string | null; notes?: string | null; status?: string;
}) {
  const url = `${env.WEB_API_BASE_URL}/api/leads`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.API_TOKEN}`,
      'X-Api-Token': env.API_TOKEN,
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    logger.error({ url, status: res.status, preview: text.slice(0, 300) }, 'Lead API error');
    throw new Error(`Lead API error ${res.status}`);
  }
  return JSON.parse(text);
}
