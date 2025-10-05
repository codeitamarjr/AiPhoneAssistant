import fetch from 'node-fetch';
import { env } from '../config/env';

export async function getListing() {
  const res = await fetch(`${env.WEB_API_BASE_URL}/api/listings/current`, {
    headers: { Authorization: `Bearer ${env.API_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch listing: ${res.status}`);
  return res.json();
}

export async function listViewingSlots() {
  const res = await fetch(`${env.WEB_API_BASE_URL}/api/viewing-slots`, {
    headers: { Authorization: `Bearer ${env.API_TOKEN}` }
  });
  if (!res.ok) throw new Error(`Failed to fetch slots`);
  return res.json();
}

export async function bookViewing(payload: { slot_id: number; name: string; phone: string; email?: string }) {
  const res = await fetch(`${env.WEB_API_BASE_URL}/api/viewings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok ? res.json() : Promise.reject(await res.text());
}
