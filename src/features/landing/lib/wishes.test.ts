import { describe, expect, it } from 'vitest';
import { fillWish, wedding } from '../../../content/wedding';
import { cleanWish, createLocalWishStore, timeAgo } from './wishes';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe('wishes', () => {
  it('ships 10 ready-made wishes with the couple names filled in', () => {
    const texts = wedding.wishes.templates.map((t) => fillWish(t, wedding));
    expect(texts).toHaveLength(10);
    expect(new Set(wedding.wishes.templates.map((t) => t.label)).size).toBe(10);
    for (const t of texts) {
      expect(t).not.toMatch(/\{(groom|bride)\}/);
      expect(t.length).toBeLessThanOrEqual(500);
    }
    expect(texts[0]).toContain(wedding.groom.shortName);
  });

  it('trims input, signs nameless wishes "Ẩn danh" and rejects empty or too long ones', () => {
    expect(cleanWish({ name: '  Lan   Anh ', message: ' Chúc mừng! ' })).toEqual({
      ok: true,
      wish: { name: 'Lan Anh', message: 'Chúc mừng!', side: undefined },
    });
    expect(cleanWish({ name: ' ', message: 'x' })).toEqual({ ok: true, wish: { name: 'Ẩn danh', message: 'x', side: undefined } });
    expect(cleanWish({ name: 'A', message: '   ' }).ok).toBe(false);
    expect(cleanWish({ name: 'A', message: 'x'.repeat(501) }).ok).toBe(false);
  });

  it('stores wishes newest first', async () => {
    const store = createLocalWishStore(memoryStorage());
    await store.add({ name: 'A', message: 'một' });
    await new Promise((r) => setTimeout(r, 5));
    await store.add({ name: 'B', message: 'hai', side: 'bride' });
    const list = await store.list();
    expect(list.map((w) => w.name)).toEqual(['B', 'A']);
    expect(list[0].side).toBe('bride');
    expect(store.shared).toBe(false);
  });

  it('formats relative times in Vietnamese', () => {
    const now = Date.UTC(2026, 9, 1, 12);
    expect(timeAgo(new Date(now - 20_000).toISOString(), now)).toBe('vừa xong');
    expect(timeAgo(new Date(now - 5 * 60_000).toISOString(), now)).toMatch(/5 phút/);
    expect(timeAgo(new Date(now - 2 * 86_400_000).toISOString(), now)).toMatch(/2 ngày|hôm kia/i);
  });
});
