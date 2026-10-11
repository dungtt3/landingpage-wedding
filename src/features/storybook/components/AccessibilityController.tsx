import { useEffect, useState } from 'react';

function queryOverride(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = new URLSearchParams(window.location.search).get('motion');
  if (v === 'reduce') return true;
  if (v === 'full') return false;
  return null;
}

/** `prefers-reduced-motion`, overridable with `?motion=reduce|full` for testing. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    const o = queryOverride();
    if (o !== null) return o;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  useEffect(() => {
    if (queryOverride() !== null) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Calls `onEscape` while `active` (used to skip the intro from the keyboard). */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onEscape]);
}

/** Locks page scroll while the cinematic intro owns the screen. */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    root.classList.add('sb-scroll-locked');
    return () => root.classList.remove('sb-scroll-locked');
  }, [locked]);
}

/** Polite live region for loading/progress/state announcements. */
export function LiveRegion({ message }: { message: string }) {
  return (
    <p className="sb-visually-hidden" role="status" aria-live="polite">
      {message}
    </p>
  );
}
