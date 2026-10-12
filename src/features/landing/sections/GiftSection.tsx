import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { GiftEnvelope } from '../components/GiftEnvelope';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

/** Lets the envelope flap open and the card slide out before the modal covers it. */
const ENVELOPE_OPEN_MS = 750;

/** Red envelope that opens a native <dialog> with the bank accounts and QR codes. */
export function GiftSection({ content }: { content: WeddingContent }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ENVELOPE_OPEN_MS;
    const timer = window.setTimeout(() => {
      if (!dialog.open) dialog.showModal();
    }, delay);
    return () => window.clearTimeout(timer);
  }, [open]);

  const copy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ''));
      setCopied(number);
    } catch {
      setCopied(null);
    }
  };

  // A click on the dialog element itself (not its content) is a click on the backdrop.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) setOpen(false);
  };

  return (
    <section id={sectionIds.gifts} className="ld-section" aria-labelledby="ld-gift-title">
      <SectionHeading id="ld-gift-title" eyebrow="Gửi lời chúc" title="Hộp mừng cưới" />
      <p className="ld-center ld-muted" data-reveal-on-scroll>
        {content.gifts.intro}
      </p>
      <div className="ld-gift-open-wrap" data-reveal-on-scroll>
        <button type="button" className="ld-gift-open" aria-haspopup="dialog" aria-label="Mở hộp mừng cưới" onClick={() => setOpen(true)}>
          <GiftEnvelope open={open} />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="ld-gift-modal"
        aria-labelledby="ld-gift-modal-title"
        onClose={() => {
          setOpen(false);
          setCopied(null);
        }}
        onClick={onDialogClick}
      >
        <div className="ld-gift-modal__head">
          <h3 id="ld-gift-modal-title">Hộp mừng cưới</h3>
          <button type="button" className="ld-gift-modal__close" aria-label="Đóng" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>
        <div className="ld-gifts">
          {content.gifts.accounts.map((a) => (
            <article key={a.owner + a.number} className="ld-gift">
              <Photo className="ld-gift__qr" src={a.qr} alt={`Mã QR chuyển khoản cho ${a.owner}`} />
              <p className="ld-gift__owner">{a.owner}</p>
              <p className="ld-muted">{a.bank}</p>
              <p className="ld-gift__number">{a.number}</p>
              <button type="button" className="ld-btn ld-btn--ghost" onClick={() => copy(a.number)}>
                {copied === a.number ? 'Đã sao chép ✓' : 'Sao chép số tài khoản'}
              </button>
            </article>
          ))}
        </div>
        <p className="ld-visually-hidden" role="status">
          {copied ? 'Đã sao chép số tài khoản.' : ''}
        </p>
      </dialog>
    </section>
  );
}
