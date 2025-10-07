import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

// ---- your original crm.js logic, unchanged (TS-compatible) ----
async function post(path: string, body: any) {
  const url = `${env.WEB_API_BASE_URL}/api${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.API_TOKEN}`,
      "X-Api-Token": env.API_TOKEN,
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) {
    logger.error(
      { path, status: res.status, ct, preview: text.slice(0, 400) },
      "Laravel API error"
    );
    throw new Error(`Laravel API error ${res.status}`);
  }
  if (!/application\/json/i.test(ct)) {
    logger.error(
      { path, ct, preview: text.slice(0, 200) },
      "Laravel API returned non-JSON"
    );
    throw new Error("Laravel API returned non-JSON");
  }
  return JSON.parse(text);
}

export function logCallStart(p: {
  callSid?: string;
  from?: string;
  to?: string;
  callerName?: string | null;
  meta?: Record<string, any>;
}) {
  return post("/calls/start", {
    twilio_call_sid: p.callSid,
    from_e164: p.from,
    to_e164: p.to,
    caller_name: p.callerName ?? null,
    status: "in-progress",
    started_at: new Date().toISOString(),
    meta: p.meta ?? { source: "voice-webhook" },
  });
}

export function logCallEnd(p: {
  callSid?: string;
  status: string;
  durationSeconds?: number | null;
  callerName?: string | null;
  meta?: Record<string, any>;
}) {
  return post("/calls/end", {
    twilio_call_sid: p.callSid,
    status: p.status,
    ended_at: new Date().toISOString(),
    duration_seconds: p.durationSeconds ?? null,
    caller_name: p.callerName ?? null,
    meta: p.meta ?? { source: "media-stream" },
  });
}

function toArray(maybe?: string | string[] | null) {
  if (!maybe) return [];
  if (Array.isArray(maybe)) return maybe.filter(Boolean);
  return maybe
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeListing(api: any) {
  const feats: string[] = [];
  if (api.ber) feats.push(`BER ${api.ber}`);
  if (api.furnished != null)
    feats.push(api.furnished ? "Furnished" : "Unfurnished");
  if (api.pets_allowed != null)
    feats.push(api.pets_allowed ? "Pets allowed" : "No pets");
  if (api.smoking_allowed != null)
    feats.push(api.smoking_allowed ? "Smoking allowed" : "No smoking");
  if (api.floor_area_sqm) feats.push(`${api.floor_area_sqm} sqm`);
  if (api.floor_number != null) feats.push(`Floor ${api.floor_number}`);
  feats.push(...toArray(api.amenities));
  feats.push(...toArray(api.policies));

  return {
    id: api.id,
    title: api.title,
    address: api.address,
    price: api.rent ?? null,
    beds: api.bedrooms ?? null,
    baths: api.bathrooms ?? null,
    features: feats.slice(0, 12),
    viewing_notes: undefined,
    contact_policy: undefined,
  };
}

export async function fetchListingByNumber({ to_e164 }: { to_e164: string }) {
  const url = `${env.WEB_API_BASE_URL}/api/listings/by-number?to_e164=${encodeURIComponent(
    to_e164
  )}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.API_TOKEN}`,
      "X-Api-Token": env.API_TOKEN,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    logger.error(
      { url, status: res.status, preview: text.slice(0, 200) },
      "fetchListingByNumber failed"
    );
    return null;
  }
  try {
    const apiListing = JSON.parse(text);
    if (!apiListing || !apiListing.id) return null;
    return normalizeListing(apiListing);
  } catch {
    logger.error(
      { url, preview: text.slice(0, 200) },
      "fetchListingByNumber non-JSON"
    );
    return null;
  }
}
