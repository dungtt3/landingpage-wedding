import { useState } from 'react';
import { sectionIds, type WeddingContent } from '../../../content/wedding';
import { Expandable } from '../components/Expandable';
import { Photo } from '../components/Photo';
import { SectionHeading } from '../components/SectionHeading';

export function GiftSection({ content }: { content: WeddingContent }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ''));
      setCopied(number);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section id={sectionIds.gifts} className="ld-section" aria-labelledby="ld-gift-title">
      <SectionHeading id="ld-gift-title" eyebrow="Gửi lời chúc" title="Hộp mừng cưới" />
      <p className="ld-center ld-muted" data-reveal-on-scroll>
        {content.gifts.intro}
      </p>
      <Expandable sectionId={sectionIds.gifts} icon="🎁" label="Mở hộp mừng cưới" hint="Thông tin chuyển khoản và mã QR">
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
      </Expandable>
      <p className="ld-visually-hidden" role="status">
        {copied ? 'Đã sao chép số tài khoản.' : ''}
      </p>
    </section>
  );
}
