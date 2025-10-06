// src/utils/context.ts
type Ctx = { from: string; to: string; groupId: number; listing: any | null };
const store = new Map<string, { ctx: Ctx; exp: number }>();
const TTL_MS = 15 * 60 * 1000;

export function setContext(callSid: string, ctx: Ctx) {
  store.set(callSid, { ctx, exp: Date.now() + TTL_MS });
}
export function getContext(callSid: string): Ctx | null {
  const row = store.get(callSid);
  if (!row) return null;
  if (Date.now() > row.exp) { store.delete(callSid); return null; }
  return row.ctx;
}
export function clearContext(callSid: string) { store.delete(callSid); }
