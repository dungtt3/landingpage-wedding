import { useEffect, useState } from 'react';
import { countdownParts } from '../lib/links';

const UNITS = [
  ['days', 'Ngày'],
  ['hours', 'Giờ'],
  ['minutes', 'Phút'],
  ['seconds', 'Giây'],
] as const;

export function Countdown({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState(() => Date.now());
  const parts = countdownParts(targetMs, now);

  useEffect(() => {
    if (parts.done) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [parts.done]);

  if (parts.done) return <p className="ld-countdown__done">Hôm nay là ngày vui của chúng mình!</p>;

  return (
    // The ticking numbers are not announced; the label gives the date once.
    <div className="ld-countdown" role="timer" aria-live="off" aria-label="Thời gian còn lại đến ngày cưới">
      {UNITS.map(([key, label]) => (
        <div key={key} className="ld-countdown__unit">
          <span className="ld-countdown__value">{String(parts[key]).padStart(2, '0')}</span>
          <span className="ld-countdown__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
