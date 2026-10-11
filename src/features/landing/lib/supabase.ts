/**
 * Minimal Supabase REST (PostgREST) client: plain fetch, no SDK. Configured by
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (the public anon / publishable
 * key; Row Level Security in `supabase/schema.sql` limits what it can do).
 * Without them the site falls back to its offline behaviour.
 */
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, '');
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && key);

export async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  if (!url || !key) throw new Error('Supabase is not configured');
  const { prefer, headers, ...rest } = init;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: key,
      // Legacy anon keys are JWTs and go in Authorization too; new `sb_publishable_…` keys only in `apikey`.
      ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const body = await res.text();
  return (body ? JSON.parse(body) : undefined) as T;
}
