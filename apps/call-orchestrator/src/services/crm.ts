import { env } from '../config/env';
import { logger } from '../config/logger';

async function post(path: string, body: any) {
  const res = await fetch(`${env.WEB_API_BASE_URL}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.API_TOKEN}`,
      'X-Api-Token': env.API_TOKEN,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    logger.error({ path, status: res.status, text }, 'Laravel API error');
    throw new Error(`Laravel API error ${res.status}`);
  }
  return res.json();
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
  const res = await fetch(`${env.WEB_API_BASE_URL}/api/v1/listings/active?group_id=${groupId}`, {
    headers: { 'Authorization': `Bearer ${env.API_TOKEN}` }
  });
  if (!res.ok) return null;
  return res.json();
}

export async function createLead(body: { group_id: number; listing_id?: number | null; call_log_id?: number | null; name?: string | null; phone_e164: string; email?: string | null; notes?: string | null; status?: string; }) {
  const res = await fetch(`${env.WEB_API_BASE_URL}/api/leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.API_TOKEN}`,
      'X-Api-Token': env.API_TOKEN,
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Lead API error ${res.status}`);
  return res.json();
}
