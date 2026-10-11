import { useEffect, type RefObject } from 'react';

/**
 * Fades `[data-reveal-on-scroll]` elements in as they enter the viewport.
 * Content stays visible without JS and with reduced motion: the hidden
 * start state only applies under `.ld.is-revealing` (set here).
 */
export function useRevealOnScroll(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.classList.add('is-revealing');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    const observeAll = () => root.querySelectorAll<HTMLElement>('[data-reveal-on-scroll]:not(.is-in)').forEach((t) => io.observe(t));
    observeAll();
    // Elements rendered later (e.g. "Xem tất cả ảnh" in the album) must reveal too, not stay hidden.
    const mo = new MutationObserver(observeAll);
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
      root.classList.remove('is-revealing');
    };
  }, [rootRef]);
}
