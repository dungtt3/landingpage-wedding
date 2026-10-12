import { useEffect, useRef, useState, type AnimationEvent, type CSSProperties, type PointerEvent } from 'react';
import { ANONYMOUS, type Wish } from '../lib/wishes';

/** Seconds one card takes to fall through the whole area: slow enough to read it on the way down. */
const FALL_SECONDS = 18;
/** Cards in the air at once (fewer when there are fewer wishes, so one wish never chases itself). */
const MAX_IN_AIR = 4;
/** Horizontal spots (0 = left edge, 1 = right edge), taken in turn so neighbours land apart. */
const LANES = [0.04, 0.66, 0.3, 0.94, 0.16, 0.8, 0.48];

interface Drop {
  key: number;
  wish: Wish;
  lane: number;
  /** Negative = already part-way down when it appears (fills the sky on arrival). */
  delay: number;
  tilt: 1 | -1;
  sway: number;
}

export function WishCard({ wish }: { wish: Wish }) {
  return (
    <div className="ld-paper-wish">
      <p className="ld-paper-wish__message">{wish.message}</p>
      <p className="ld-paper-wish__meta">
        <strong>{wish.name || ANONYMOUS}</strong>
        {wish.side && <span className="ld-paper-wish__side">{wish.side === 'groom' ? 'Nhà trai' : 'Nhà gái'}</span>}
      </p>
    </div>
  );
}

/**
 * Wishes falling like petals, each written on a little cream card with a red
 * border. Hovering a card (or tapping it, on touch screens) holds that card
 * still to read while the others keep falling.
 * Purely visual: the section also lists every wish for screen readers.
 */
export function WishFall({ wishes }: { wishes: Wish[] }) {
  const [drops, setDrops] = useState<Drop[]>([]);
  // Cards held by a tap (touch screens); the mouse holds a card with :hover in CSS.
  const [held, setHeld] = useState<ReadonlySet<number>>(new Set());
  const count = useRef(0);
  const nextWish = useRef(0);
  const seen = useRef<Set<string> | null>(null);
  const wishesRef = useRef(wishes);
  wishesRef.current = wishes;

  const inAir = Math.min(wishes.length, MAX_IN_AIR);
  const every = FALL_SECONDS / Math.max(inAir, 1);

  const drop = (wish: Wish, delay = 0): Drop => {
    const n = count.current++;
    return { key: n, wish, lane: LANES[n % LANES.length], delay, tilt: n % 2 ? 1 : -1, sway: 3.2 + (n % 3) * 0.6 };
  };

  // A wish just sent (not seen before) falls right away.
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(wishes.map((w) => w.id));
      return;
    }
    const fresh = wishes.filter((w) => !seen.current!.has(w.id));
    fresh.forEach((w) => seen.current!.add(w.id));
    if (fresh.length) setDrops((d) => [...d, ...fresh.map((w) => drop(w))]);
  }, [wishes]);

  // Fill the sky at once, then keep one card coming every `every` seconds.
  useEffect(() => {
    if (!inAir) return;
    const take = () => wishesRef.current[nextWish.current++ % wishesRef.current.length];
    setDrops(Array.from({ length: inAir }, (_, i) => drop(take(), -i * every)));
    const timer = window.setInterval(() => {
      setDrops((d) => [...d, drop(take())]);
    }, every * 1000);
    return () => window.clearInterval(timer);
  }, [inAir, every]);

  const landed = (key: number) => (e: AnimationEvent) => {
    if (e.target !== e.currentTarget) return;
    setDrops((d) => d.filter((x) => x.key !== key));
    setHeld((h) => (h.has(key) ? new Set([...h].filter((k) => k !== key)) : h));
  };

  // Touch / pen: tap a card to hold it, tap again to let it fall on.
  const onTap = (key: number) => (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    setHeld((h) => {
      const next = new Set(h);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };

  return (
    <div
      className="ld-wishfall"
      aria-hidden="true"
      style={{ '--fall': `${FALL_SECONDS}s` } as CSSProperties}
    >
      {drops.map((d) => (
        <div
          key={d.key}
          className="ld-drop"
          data-held={held.has(d.key)}
          style={{ '--lane': d.lane, '--delay': `${d.delay}s`, '--tilt': d.tilt, '--sway': `${d.sway}s` } as CSSProperties}
          onAnimationEnd={landed(d.key)}
          onPointerUp={onTap(d.key)}
        >
          <div className="ld-drop__sway">
            <WishCard wish={d.wish} />
          </div>
        </div>
      ))}
      <p className="ld-wishfall__hint">Di chuột vào hoặc chạm vào một lời chúc để dừng lại đọc</p>
    </div>
  );
}
