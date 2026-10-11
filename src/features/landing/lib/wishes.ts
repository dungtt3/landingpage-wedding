import { rest, supabaseConfigured } from './supabase';

export interface Wish {
  id: string;
  name: string;
  message: string;
  /** ISO timestamp. */
  createdAt: string;
  side?: 'groom' | 'bride';
}

export type NewWish = Pick<Wish, 'name' | 'message' | 'side'>;

export interface WishStore {
  /** `true` when wishes are shared between guests (a real backend). */
  readonly shared: boolean;
  /** Newest first. */
  list(): Promise<Wish[]>;
  add(wish: NewWish): Promise<Wish>;
}

export const WISH_LIMITS = { name: 60, message: 500 } as const;

/** Shown (and stored) when the guest leaves the name empty. */
export const ANONYMOUS = 'Ẩn danh';

/** Trims and validates a new wish; returns an error message or the clean wish. */
export function cleanWish(input: NewWish): { ok: true; wish: NewWish } | { ok: false; error: string } {
  const name = input.name.replace(/\s+/g, ' ').trim() || ANONYMOUS;
  const message = input.message.trim().replace(/\n{3,}/g, '\n\n');
  if (!message) return { ok: false, error: 'Bạn viết hoặc chọn một lời chúc nhé.' };
  if (name.length > WISH_LIMITS.name) return { ok: false, error: `Tên tối đa ${WISH_LIMITS.name} ký tự.` };
  if (message.length > WISH_LIMITS.message) return { ok: false, error: `Lời chúc tối đa ${WISH_LIMITS.message} ký tự.` };
  return { ok: true, wish: { name, message, side: input.side } };
}

const KEY = 'wedding-wishes';

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Fallback when Supabase is not configured: keeps wishes in this browser's
 * localStorage, so each guest only sees their own.
 */
export function createLocalWishStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeLocalStorage()): WishStore {
  let memory: Wish[] = [];
  const read = (): Wish[] => {
    if (!storage) return memory;
    try {
      const parsed = JSON.parse(storage.getItem(KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const write = (wishes: Wish[]) => {
    memory = wishes;
    try {
      storage?.setItem(KEY, JSON.stringify(wishes));
    } catch {
      /* storage full or blocked: keep the in-memory copy */
    }
  };
  return {
    shared: false,
    async list() {
      return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async add(input) {
      const wish: Wish = { ...input, id: newId(), createdAt: new Date().toISOString() };
      write([wish, ...read()]);
      return wish;
    },
  };
}

function safeLocalStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

interface WishRow {
  id: string;
  created_at: string;
  name: string;
  message: string;
  side: 'groom' | 'bride' | null;
}

const fromRow = (r: WishRow): Wish => ({ id: r.id, name: r.name, message: r.message, createdAt: r.created_at, side: r.side ?? undefined });
const COLUMNS = 'id,created_at,name,message,side';

/** Wishes shared between all guests, in Supabase (`wishes` table; hidden rows are not returned). */
export function createSupabaseWishStore(): WishStore {
  return {
    shared: true,
    async list() {
      const rows = await rest<WishRow[]>(`wishes?select=${COLUMNS}&order=created_at.desc&limit=500`);
      return rows.map(fromRow);
    },
    async add(input) {
      const body = { name: input.name, message: input.message, side: input.side ?? null };
      const [row] = await rest<WishRow[]>(`wishes?select=${COLUMNS}`, {
        method: 'POST',
        body: JSON.stringify(body),
        prefer: 'return=representation',
      });
      return fromRow(row);
    },
  };
}

export const wishStore: WishStore = supabaseConfigured ? createSupabaseWishStore() : createLocalWishStore();

/** "vừa xong", "5 phút trước", "2 ngày trước"… */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  if (Math.abs(seconds) < 60) return 'vừa xong';
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ['minute', 60],
    ['hour', 3600],
    ['day', 86400],
    ['month', 2592000],
    ['year', 31536000],
  ];
  let unit: Intl.RelativeTimeFormatUnit = 'minute';
  let size = 60;
  for (const [u, s] of steps) if (Math.abs(seconds) >= s) [unit, size] = [u, s];
  return rtf.format(Math.round(seconds / size), unit);
}
