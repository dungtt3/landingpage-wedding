import { rest, supabaseConfigured } from './supabase';

export interface RsvpPayload {
  name: string;
  attending: 'yes' | 'no';
  /** Taken from the invitation link (`?place=`), never asked. */
  side: 'groom' | 'bride' | 'both';
}

/**
 * Saves an RSVP in Supabase (`rsvps` table; guests can insert, not read).
 * Without Supabase configured it only resolves, so the form still works locally.
 */
export async function submitRsvp(payload: RsvpPayload): Promise<void> {
  if (!supabaseConfigured) {
    if (import.meta.env.DEV) console.info('[rsvp] not sent — Supabase not configured', payload);
    return;
  }
  // One RSVP = one person; `guests` keeps the table's head count meaningful (0 when not coming).
  const row = { ...payload, guests: payload.attending === 'yes' ? 1 : 0 };
  await rest('rsvps', { method: 'POST', body: JSON.stringify(row), prefer: 'return=minimal' });
}
