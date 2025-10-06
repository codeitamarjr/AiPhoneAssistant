// In-memory call context store (for active listing, etc)
type Listing = { id?: number | string; title?: string; address?: string } | null;
type Ctx = { listing?: Listing; preGreeted?: boolean };

const store = new Map<string, Ctx>();

export const callContext = {
  set: (sid: string, value: Ctx) => store.set(sid, value),
  get: (sid: string) => store.get(sid),
  delete: (sid: string) => store.delete(sid),
};
