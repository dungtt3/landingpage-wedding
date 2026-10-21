import { rest, supabaseConfigured } from './supabase';

/** A guest from the `guests` table: who they are and which party (`place`) they are invited to. */
export interface Guest {
  name: string;
  place: number;
}

/** A blank page while it waits: give up on a slow lookup and show the generic card. */
const LOOKUP_TIMEOUT_MS = 4000;

/**
 * The code in a short invitation link, `/g/<code>`, lower-cased; null for any
 * other path. Anything a chat app glues on after the 6 letters is ignored.
 */
export function guestCodeFromPath(pathname: string): string | null {
  const match = /^\/g\/([a-z0-9]{6})/i.exec(pathname);
  return match ? match[1].toLowerCase() : null;
}

/** The query string the guest helpers in `content/wedding.ts` read, for this guest. */
export function searchForGuest(guest: Guest): string {
  return `?${new URLSearchParams({ place: String(guest.place), name: guest.name })}`;
}

let search = typeof window === 'undefined' ? '' : window.location.search;

/**
 * What to pass the guest helpers instead of `window.location.search`: the real
 * query (`?place=&name=` links), or one built from the guest a `/g/<code>`
 * link points at once `resolveGuestLink` has looked them up.
 */
export function guestSearch(): string {
  return search;
}

/**
 * Looks up the guest behind a `/g/<code>` link before the page renders.
 * Never throws: an unknown code, no Supabase or a dead network leaves the
 * generic invitation ("Quý khách", every party).
 */
export async function resolveGuestLink(pathname: string): Promise<void> {
  const code = guestCodeFromPath(pathname);
  if (!code || !supabaseConfigured) return;
  const cacheKey = `guest:${code}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      search = cached;
      return;
    }
  } catch {
    // Storage blocked: just look it up.
  }
  try {
    const [guest] = await rest<Guest[]>('rpc/guest_by_code', {
      method: 'POST',
      body: JSON.stringify({ p_code: code }),
      timeoutMs: LOOKUP_TIMEOUT_MS,
    });
    if (!guest) return;
    search = searchForGuest(guest);
    try {
      sessionStorage.setItem(cacheKey, search);
    } catch {
      // Not cached: the next visit looks it up again.
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[guests] lookup failed', err);
  }
}

/** A guest as /admin lists them. */
export interface GuestRow extends Guest {
  code: string;
  created_at: string;
}

/** Thrown by the admin calls when the password is wrong (or was changed). */
export class AdminKeyError extends Error {}

async function adminRpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabaseConfigured) throw new Error('Supabase is not configured');
  try {
    return await rest<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
  } catch (err) {
    if (err instanceof Error && err.message.includes('invalid admin key')) throw new AdminKeyError('Sai mật khẩu');
    throw err;
  }
}

/** Whether an /admin password has been chosen yet (the first visit sets it). */
export const adminHasKey = () => adminRpc<boolean>('admin_has_key', {});

/** Sets the /admin password; only works the very first time. */
export const adminSetKey = (key: string) => adminRpc<void>('admin_set_key', { p_new: key });

export const adminLogin = (key: string) => adminRpc<boolean>('admin_login', { p_key: key });

/** Every guest, newest first. */
export const listGuests = (key: string) => adminRpc<GuestRow[]>('admin_list_guests', { p_key: key });

/** Adds guests (one from the form, or a whole Excel sheet) and returns them with their new codes. */
export const addGuests = (key: string, guests: Guest[]) => adminRpc<GuestRow[]>('admin_add_guests', { p_key: key, p_guests: guests });

export async function updateGuest(key: string, code: string, guest: Guest): Promise<GuestRow> {
  const [row] = await adminRpc<GuestRow[]>('admin_update_guest', { p_key: key, p_code: code, p_name: guest.name, p_place: guest.place });
  if (!row) throw new Error(`No guest ${code}`);
  return row;
}
