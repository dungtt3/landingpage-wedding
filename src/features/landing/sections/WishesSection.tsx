import { useEffect, useState, type FormEvent } from 'react';
import { fillWish, mainEvent, sectionIds, type WeddingContent } from '../../../content/wedding';
import { Expandable } from '../components/Expandable';
import { WishCard, WishFall } from '../components/WishFall';
import { SectionHeading } from '../components/SectionHeading';
import { ANONYMOUS, cleanWish, WISH_LIMITS, wishStore, type Wish, type WishStore } from '../lib/wishes';

/** Guestbook: leave a wish (from a ready-made template or your own words) and read everyone's wishes. */
export function WishesSection({ content, store = wishStore }: { content: WeddingContent; store?: WishStore }) {
  const templates = content.wishes.templates.map((t) => ({
    label: t.label,
    text: fillWish(t, content),
  }));
  const side = mainEvent(content).side;

  const [wishes, setWishes] = useState<Wish[] | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    store
      .list()
      .then((list) => !cancelled && setWishes(list))
      .catch(() => !cancelled && setWishes([]));
    return () => {
      cancelled = true;
    };
  }, [store]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = cleanWish({ name, message, side });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setStatus('sending');
    try {
      const saved = await store.add(result.wish);
      setWishes((list) => [saved, ...(list ?? [])]);
      setMessage('');
      setStatus('sent');
    } catch {
      setError('Chưa gửi được lời chúc, bạn thử lại giúp chúng mình nhé.');
      setStatus('idle');
    }
  };

  const reducedMotion = useReducedMotion();

  return (
    <section id={sectionIds.wishes} className="ld-section ld-section--tint" aria-labelledby="ld-wishes-title">
      <SectionHeading id="ld-wishes-title" eyebrow="Sổ lưu bút" title="Gửi lời chúc" />
      <p className="ld-center ld-muted" data-reveal-on-scroll>
        {content.wishes.intro}
      </p>

      <Expandable sectionId={sectionIds.wishes} icon="✎" label="Viết lời chúc" hint="Có sẵn 10 lời chúc mẫu để chọn nhanh">
        <form className="ld-form ld-wish-form" onSubmit={onSubmit} noValidate>
          <label className="ld-field ld-field--wide">
            <span>
              Tên của bạn <small className="ld-muted">(không bắt buộc)</small>
            </span>
            <input
              name="name"
              autoComplete="name"
              maxLength={WISH_LIMITS.name}
              placeholder={ANONYMOUS}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <fieldset className="ld-field ld-field--wide ld-templates">
            <legend>Chọn nhanh một lời chúc</legend>
            <div className="ld-templates__list">
              {templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  className="ld-template"
                  aria-pressed={message === t.text}
                  title={t.text}
                  onClick={() => {
                    setMessage(t.text);
                    setStatus('idle');
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="ld-field ld-field--wide">
            <span>
              Lời chúc <small className="ld-muted">(có thể sửa lại sau khi chọn)</small>
            </span>
            <textarea
              name="message"
              rows={4}
              maxLength={WISH_LIMITS.message}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setStatus('idle');
              }}
              required
            />
            <small className="ld-field__count" aria-hidden="true">
              {message.length}/{WISH_LIMITS.message}
            </small>
          </label>

          {error && (
            <p className="ld-form__error" role="alert">
              {error}
            </p>
          )}
          {status === 'sent' && (
            <p className="ld-form__ok ld-field--wide" role="status">
              Cảm ơn bạn! Lời chúc đã được gửi tới {content.groom.shortName} & {content.bride.shortName}.
            </p>
          )}
          <button type="submit" className="ld-btn ld-btn--primary ld-field--wide" disabled={status === 'sending'}>
            {status === 'sending' ? 'Đang gửi…' : 'Gửi lời chúc'}
          </button>
          {!store.shared && (
            <p className="ld-form__note ld-field--wide">
              Bản thử nghiệm: lời chúc hiện chỉ lưu trên trình duyệt của bạn, chưa gửi lên máy chủ.
            </p>
          )}
        </form>
      </Expandable>

      <div className="ld-wishes">
        <h3 className="ld-wishes__title">Lời chúc từ mọi người</h3>
        {wishes === null ? (
          <p className="ld-center ld-muted">Đang tải lời chúc…</p>
        ) : wishes.length === 0 ? (
          <p className="ld-center ld-muted">Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!</p>
        ) : (
          <>
            {/* Screen readers get the plain list; the falling cards are decoration over it. */}
            <ul className={reducedMotion ? 'ld-wishlist' : 'ld-visually-hidden'} aria-label="Lời chúc từ mọi người">
              {wishes.map((w) => (
                <li key={w.id}>
                  <WishCard wish={w} />
                </li>
              ))}
            </ul>
            {!reducedMotion && <WishFall wishes={wishes} />}
          </>
        )}
      </div>
    </section>
  );
}

/** Follows the "reduce motion" system setting, also when it changes while the page is open. */
function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setReduced(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
