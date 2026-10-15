/**
 * Minimal Supabase REST (PostgREST) client: plain fetch, no SDK. Configured by
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the public anon / publishable
 * key; Row Level Security in `supabase/schema.sql` limits what it can do).
 * Without them the site falls back to its offline behaviour.
 */
const directUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * In production requests go to `/sb` on this site, which vercel.json rewrites
 * to the Supabase project: guests whose network blocks `*.supabase.co` can
 * still RSVP and send wishes. Keep that rewrite's destination in step with
 * VITE_SUPABASE_URL.
 */
const url = directUrl && (import.meta.env.PROD ? '/sb' : directUrl);

/** A blocked or dead connection must not leave the form on "Đang gửi…" for minutes. */
const TIMEOUT_MS = 12000;

export const supabaseConfigured = Boolean(url && key);

export async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  if (!url || !key) throw new Error('Supabase is not configured');
  const { prefer, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...rest,
    signal: controller.signal,
    headers: {
      apikey: key,
      // Legacy anon keys are JWTs and go in Authorization too; new `sb_publishable_…` keys only in `apikey`.
      ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
  }).finally(() => window.clearTimeout(timer));
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const body = await res.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
