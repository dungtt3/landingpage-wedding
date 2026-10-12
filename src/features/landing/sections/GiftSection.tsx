import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { sectionIds, type GiftAccount, type WeddingContent } from '../../../content/wedding';
import { GiftEnvelope } from '../components/GiftEnvelope';
import { hasPhoto, Photo } from '../components/Photo';
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

  // QR images as files, fetched when the modal opens: Safari only shows the share sheet
  // right after a tap, so there must be no download between the tap and share().
  const qrFiles = useRef(new Map<string, File>());
  useEffect(() => {
    if (!open) return;
    for (const a of content.gifts.accounts) {
      if (!hasPhoto(a.qr) || qrFiles.current.has(a.qr)) continue;
      fetch(a.qr)
        .then((r) => r.blob())
        .then((blob) => qrFiles.current.set(a.qr, new File([blob], qrFileName(a), { type: blob.type })))
        .catch(() => {});
    }
  }, [open, content.gifts.accounts]);

  // Phones: the share sheet offers "Save image" (into Photos, where banking apps can scan it from).
  // Without sharing (or if it is refused), a plain file download.
  const saveQr = async (account: GiftAccount) => {
    const file = qrFiles.current.get(account.qr);
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return;
      } catch (e) {
        // Closing the share sheet is not an error worth a fallback.
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    download(account.qr, qrFileName(account));
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
              <div className="ld-gift__actions">
                <button type="button" className="ld-btn ld-btn--ghost" onClick={() => copy(a.number)}>
                  {copied === a.number ? 'Đã sao chép ✓' : 'Sao chép số tài khoản'}
                </button>
                {hasPhoto(a.qr) && (
                  <button type="button" className="ld-btn ld-btn--primary ld-gift__save" onClick={() => saveQr(a)}>
                    Tải mã QR
                  </button>
                )}
              </div>
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

function download(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

function qrFileName(account: GiftAccount) {
  return `QR-${account.owner.replace(/\s+/g, '-')}.${account.qr.split('.').pop() ?? 'png'}`;
}
