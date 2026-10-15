import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

/** Cards drawn on each side of the current photo (one more than visible, so cards slide in instead of popping). */
const SIDE = 3;
/** Horizontal swipe distance (px) that counts as "next / previous photo". */
const SWIPE_PX = 40;

/** Signed shortest distance from `active` to `i` on a ring of `n` photos (the album loops). */
function ringOffset(i: number, active: number, n: number) {
  let d = (i - active) % n;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/**
 * Coverflow album: the current photo large in the middle, its neighbours
 * smaller and turned away, and a strip of thumbnails underneath to jump to
 * any photo. The middle photo opens in a native <dialog> lightbox.
 */
export function GallerySection({ content }: { content: WeddingContent }) {
  const photos = content.gallery;
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const swipeFrom = useRef<number | null>(null);
  // A swipe that ends on a card still fires its click; that click must not undo the swipe.
  const swiped = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (zoomed && !dialog.open) dialog.showModal();
    if (!zoomed && dialog.open) dialog.close();
  }, [zoomed]);

  // Keep the current thumbnail in the middle of the strip (scrolls the strip only, never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [active]);

  const step = (d: number) => setActive((i) => (i + d + photos.length) % photos.length);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };

  const onPointerDown = (e: PointerEvent) => {
    swipeFrom.current = e.clientX;
    swiped.current = false;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (swipeFrom.current === null) return;
    const dx = e.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(dx) < SWIPE_PX) return;
    swiped.current = true;
    step(dx < 0 ? 1 : -1);
  };

  const current = photos[active];

  return (
    <section id={sectionIds.gallery} className="ld-section ld-section--tint" aria-labelledby="ld-gallery-title">
      <SectionHeading id="ld-gallery-title" eyebrow="Khoảnh khắc" title="Album ảnh cưới" />
      <div className="ld-album" role="region" aria-roledescription="carousel" aria-label="Album ảnh cưới" onKeyDown={onKey} data-reveal-on-scroll>
        <div
          className="ld-album__stage"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (swipeFrom.current = null)}
        >
          {photos.map((p, i) => {
            const d = ringOffset(i, active, photos.length);
            if (Math.abs(d) > SIDE) return null;
            const isCurrent = d === 0;
            return (
              <button
                key={p.src}
                type="button"
                className="ld-album__card"
                data-current={isCurrent}
                data-edge={Math.abs(d) === SIDE}
                style={{ '--d': d, '--abs': Math.abs(d) } as CSSProperties}
                // Side cards are reachable through the arrows and thumbnails; only the middle one takes focus.
                tabIndex={isCurrent ? 0 : -1}
                aria-hidden={isCurrent ? undefined : true}
                aria-label={isCurrent ? `Xem lớn: ${p.alt}` : undefined}
                onClick={() => {
                  if (swiped.current) return;
                  if (isCurrent) setZoomed(true);
                  else setActive(i);
                }}
              >
                <Photo src={p.src} alt={isCurrent ? p.alt : ''} sizes="(max-width: 600px) 60vw, 310px" />
              </button>
            );
          })}
          <button type="button" className="ld-album__arrow ld-album__arrow--prev" onClick={() => step(-1)} aria-label="Ảnh trước">
            ‹
          </button>
          <button type="button" className="ld-album__arrow ld-album__arrow--next" onClick={() => step(1)} aria-label="Ảnh sau">
            ›
          </button>
        </div>

        <p className="ld-album__count" aria-live="polite">
          {active + 1} / {photos.length}
        </p>

        <ul ref={stripRef} className="ld-album__strip" aria-label="Chọn ảnh">
          {photos.map((p, i) => (
            <li key={p.src}>
              <button
                type="button"
                className="ld-album__thumb"
                aria-current={i === active ? 'true' : undefined}
                aria-label={`Ảnh ${i + 1}`}
                onClick={() => setActive(i)}
              >
                <Photo src={p.src} alt="" sizes="60px" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog ref={dialogRef} className="ld-lightbox" aria-label="Xem ảnh" onClose={() => setZoomed(false)} onKeyDown={onKey}>
        {zoomed && (
          <>
            <figure className="ld-lightbox__figure">
              <Photo src={current.src} alt={current.alt} sizes="min(48vh, 460px)" priority />
              <figcaption>
                {current.alt} · {active + 1}/{photos.length}
              </figcaption>
            </figure>
            <div className="ld-lightbox__controls">
              <button type="button" className="ld-btn ld-btn--ghost" onClick={() => step(-1)} aria-label="Ảnh trước">
                ‹
              </button>
              <button type="button" className="ld-btn ld-btn--primary" onClick={() => setZoomed(false)}>
                Đóng
              </button>
              <button type="button" className="ld-btn ld-btn--ghost" onClick={() => step(1)} aria-label="Ảnh sau">
                ›
              </button>
            </div>
          </>
        )}
      </dialog>
    </section>
  );
}
