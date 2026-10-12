/** Red "song hỷ" envelope body (no flap), drawn in a 190×275 box. Gradients live in <EnvelopeDefs>. */
function EnvelopeBody() {
  return (
    <>
      <rect x="4" y="4" width="182" height="267" rx="10" fill="url(#ld-env-red)" stroke="#e2aa5c" strokeWidth="2" />
      <rect x="12" y="12" width="166" height="251" rx="6" fill="none" stroke="#e2aa5c" strokeWidth="1.2" opacity="0.7" />
      <circle cx="95" cy="152" r="34" fill="url(#ld-env-gold)" />
      <circle cx="95" cy="152" r="28" fill="none" stroke="#a3121b" strokeWidth="1.5" />
      <text x="95" y="165" textAnchor="middle" fontSize="36" fontWeight="700" fill="#a3121b">
        囍
      </text>
      <path d="M40 232 h110 M55 242 h80" stroke="#e2aa5c" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </>
  );
}

const flapPath = 'M4 14 Q4 4 14 4 H176 Q186 4 186 14 V40 L95 112 L4 40 Z';

function EnvelopeDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="ld-env-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d72a33" />
          <stop offset="1" stopColor="#9b111a" />
        </linearGradient>
        <linearGradient id="ld-env-flap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b51821" />
          <stop offset="1" stopColor="#8c0f17" />
        </linearGradient>
        <radialGradient id="ld-env-gold" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fbe3a6" />
          <stop offset="1" stopColor="#d99b3e" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/**
 * Two red wedding envelopes leaning on each other, with sparkles and "Nhấn để mở".
 * Opening lifts the front envelope's flap and slides a card out of it.
 */
export function GiftEnvelope({ open }: { open: boolean }) {
  return (
    <span className="ld-env" data-open={open} aria-hidden="true">
      <EnvelopeDefs />
      <span className="ld-env__sparkle" style={{ top: '6%', left: '12%', fontSize: 21 }}>✦</span>
      <span className="ld-env__sparkle" style={{ top: '14%', right: '8%', fontSize: 15, animationDelay: '0.6s' }}>✦</span>
      <span className="ld-env__sparkle" style={{ top: '34%', left: '3%', fontSize: 13, animationDelay: '1.1s' }}>✦</span>
      <span className="ld-env__sparkle" style={{ top: '24%', right: '3%', fontSize: 13, animationDelay: '1.7s' }}>✦</span>

      <span className="ld-env__stage">
        <span className="ld-env__shadow" />
        <svg className="ld-env__back" viewBox="0 0 190 275">
          <EnvelopeBody />
          <path d={flapPath} fill="url(#ld-env-flap)" stroke="#e2aa5c" strokeWidth="1.5" />
        </svg>

        <span className="ld-env__front">
          <svg className="ld-env__flap" viewBox="0 0 190 275">
            <path d={flapPath} fill="url(#ld-env-flap)" stroke="#e2aa5c" strokeWidth="1.5" />
          </svg>
          <span className="ld-env__card">
            <span className="ld-env__card-mark">囍</span>
            <span>Mừng cưới</span>
          </span>
          <svg className="ld-env__body" viewBox="0 0 190 275">
            <EnvelopeBody />
          </svg>
        </span>
      </span>

      <span className="ld-env__hint">Nhấn để mở</span>
    </span>
  );
}
