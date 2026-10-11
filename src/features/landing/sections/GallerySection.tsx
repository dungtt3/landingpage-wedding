import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

/** Photos shown before the guest asks for the whole album (a full row on desktop and mobile). */
const PREVIEW_COUNT = 6;

/** Photo grid with a native <dialog> lightbox (focus trap + Escape for free). */
export function GallerySection({ content }: { content: WeddingContent }) {
  const photos = content.gallery;
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? photos : photos.slice(0, PREVIEW_COUNT);
  const toggleAll = () => {
    // Collapsing from far down the long grid: bring the album back into view.
    if (showAll) document.getElementById(sectionIds.gallery)?.scrollIntoView();
    setShowAll(!showAll);
  };
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open !== null && !dialog.open) dialog.showModal();
    if (open === null && dialog.open) dialog.close();
  }, [open]);

  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };

  const current = open === null ? null : photos[open];

  return (
    <section id={sectionIds.gallery} className="ld-section ld-section--tint" aria-labelledby="ld-gallery-title">
      <SectionHeading id="ld-gallery-title" eyebrow="Khoảnh khắc" title="Album ảnh cưới" />
      <ul className="ld-gallery">
        {visible.map((p, i) => (
          <li key={p.src} className={`ld-gallery__item ld-gallery__item--${p.shape ?? 'square'}`} data-reveal-on-scroll>
            <button type="button" className="ld-gallery__open" onClick={() => setOpen(i)} aria-label={`Xem lớn: ${p.alt}`}>
              <Photo src={p.src} alt={p.alt} />
            </button>
          </li>
        ))}
      </ul>
      {photos.length > PREVIEW_COUNT && (
        <div className="ld-gallery__more">
          <button type="button" className="ld-btn ld-btn--ghost" onClick={toggleAll} aria-expanded={showAll}>
            {showAll ? 'Thu gọn album' : `Xem tất cả ${photos.length} ảnh`}
          </button>
        </div>
      )}

      <dialog ref={dialogRef} className="ld-lightbox" aria-label="Xem ảnh" onClose={() => setOpen(null)} onKeyDown={onKey}>
        {current && (
          <>
            <figure className="ld-lightbox__figure">
              <Photo src={current.src} alt={current.alt} priority />
              <figcaption>
                {current.alt} · {open! + 1}/{photos.length}
              </figcaption>
            </figure>
            <div className="ld-lightbox__controls">
              <button type="button" className="ld-btn ld-btn--ghost" onClick={() => step(-1)} aria-label="Ảnh trước">
                ‹
              </button>
              <button type="button" className="ld-btn ld-btn--primary" onClick={() => setOpen(null)}>
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
