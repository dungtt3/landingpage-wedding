import { useState, type FormEvent } from 'react';
import { guestName, guestSide, sectionIds, type WeddingContent } from '../../../content/wedding';
import { Expandable } from '../components/Expandable';
import { SectionHeading } from '../components/SectionHeading';
import { submitRsvp, type RsvpPayload } from '../lib/rsvp';
import { supabaseConfigured } from '../lib/supabase';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function RsvpSection({ content }: { content: WeddingContent }) {
  const [status, setStatus] = useState<Status>('idle');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload: RsvpPayload = {
      name: String(data.get('name') ?? '').trim(),
      attending,
      side: guestSide(content, window.location.search),
    };
    setStatus('sending');
    try {
      await submitRsvp(payload);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section id={sectionIds.rsvp} className="ld-section" aria-labelledby="ld-rsvp-title">
      <SectionHeading id="ld-rsvp-title" eyebrow={`Vui lòng phản hồi ${content.rsvp.deadlineLabel}`} title="Xác nhận tham dự" />
      <Expandable sectionId={sectionIds.rsvp} icon="✉" label="Điền phiếu xác nhận tham dự" hint="Chỉ mất chưa tới một phút">
        <div className="ld-rsvp">
          <p className="ld-rsvp__intro">{content.rsvp.note}</p>
          {status === 'sent' ? (
            <p className="ld-rsvp__done" role="status">
              {attending === 'yes'
                ? 'Cảm ơn bạn! Hẹn gặp bạn trong ngày vui nhé.'
                : 'Cảm ơn bạn đã báo tin, chúng mình rất tiếc vì không gặp được bạn.'}
              {!supabaseConfigured && <small> (Bản thử nghiệm — chưa kết nối máy chủ.)</small>}
            </p>
          ) : (
            <form className="ld-form" onSubmit={onSubmit}>
              <label className="ld-field ld-field--wide">
                <span>Họ và tên</span>
                <input name="name" required autoComplete="name" maxLength={80} defaultValue={guestName(window.location.search)} />
              </label>
              <fieldset className="ld-field ld-field--wide ld-choice">
                <legend>Bạn sẽ đến chứ?</legend>
                <label>
                  <input type="radio" name="attending" value="yes" checked={attending === 'yes'} onChange={() => setAttending('yes')} />{' '}
                  Chắc chắn rồi
                </label>
                <label>
                  <input type="radio" name="attending" value="no" checked={attending === 'no'} onChange={() => setAttending('no')} /> Rất
                  tiếc, không thể
                </label>
              </fieldset>
              {status === 'error' && (
                <p className="ld-form__error" role="alert">
                  Chưa gửi được, bạn thử lại giúp chúng mình nhé.
                </p>
              )}
              <button type="submit" className="ld-btn ld-btn--primary ld-field--wide" disabled={status === 'sending'}>
                {status === 'sending' ? 'Đang gửi…' : 'Gửi xác nhận'}
              </button>
            </form>
          )}
        </div>
      </Expandable>
    </section>
  );
}
