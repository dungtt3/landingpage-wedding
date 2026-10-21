import { useEffect, useState, type FormEvent } from 'react';
import { wedding } from '../../content/wedding';
import { createGuest, type Guest } from '../landing/lib/guests';
import { supabaseConfigured } from '../landing/lib/supabase';
import '../landing/landing.css';
import './admin.css';

interface CreatedLink extends Guest {
  code: string;
  createdAt: string;
}

type Status = 'idle' | 'sending' | 'error';

/** Links made on this device, newest first (only a convenience: the table in Supabase is the record). */
const HISTORY_KEY = 'admin:guest-links';
const HISTORY_MAX = 200;

function loadHistory(): CreatedLink[] {
  try {
    const list: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(list) ? (list as CreatedLink[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(list: CreatedLink[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_MAX)));
  } catch {
    // Storage blocked: the list just is not kept.
  }
}

const linkFor = (code: string) => `${window.location.origin}/g/${code}`;

const eventFor = (place: number) => wedding.events.find((e) => e.place === place);

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function LinkActions({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (await copyText(link)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } else {
      window.prompt('Sao chép link này:', link);
    }
  };
  const canShare = typeof navigator.share === 'function';
  return (
    <div className="ad-link__actions">
      <button type="button" className="ld-btn ld-btn--primary" onClick={copy}>
        {copied ? 'Đã sao chép' : 'Sao chép link'}
      </button>
      {canShare && (
        <button type="button" className="ld-btn ld-btn--ghost" onClick={() => navigator.share({ url: link }).catch(() => undefined)}>
          Chia sẻ
        </button>
      )}
      <a className="ld-btn ld-btn--ghost" href={link} target="_blank" rel="noreferrer">
        Mở thử
      </a>
    </div>
  );
}

/**
 * `/admin`: type a guest's name, pick their party, get a short `/g/<code>`
 * link that survives being sent through Zalo / Messenger.
 */
export function AdminPage() {
  const [name, setName] = useState('');
  const [place, setPlace] = useState(wedding.events[0].place);
  const [status, setStatus] = useState<Status>('idle');
  const [latest, setLatest] = useState<CreatedLink | null>(null);
  const [history, setHistory] = useState(loadHistory);

  useEffect(() => {
    document.title = 'Tạo link mời';
    // Keep the page out of search results.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const guest = { name: name.replace(/\s+/g, ' ').trim(), place };
    if (!guest.name) return;
    setStatus('sending');
    try {
      const code = await createGuest(guest);
      const created = { ...guest, code, createdAt: new Date().toISOString() };
      const next = [created, ...history];
      setLatest(created);
      setHistory(next);
      saveHistory(next);
      setName('');
      setStatus('idle');
    } catch (err) {
      console.error('[admin] could not create link', err);
      setStatus('error');
    }
  };

  return (
    <main className="ld ad">
      <div className="ld-card ad-card">
        <h1 className="ad-title">Tạo link mời</h1>
        <p className="ad-intro">Nhập tên khách và chọn tiệc. Link ngắn gửi qua Zalo, Messenger vẫn giữ nguyên.</p>

        {!supabaseConfigured && (
          <p className="ld-form__error" role="alert">
            Chưa kết nối Supabase (thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY), không tạo được link.
          </p>
        )}

        <form className="ld-form" onSubmit={onSubmit}>
          <label className="ld-field ld-field--wide">
            <span>Tên khách (hiện trên thiệp: “Kính gửi …”)</span>
            <input
              name="name"
              required
              maxLength={60}
              autoComplete="off"
              placeholder="VD: Anh Nam"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <fieldset className="ld-field ld-field--wide ld-choice">
            <legend>Mời dự tiệc</legend>
            {wedding.events.map((event) => (
              <label key={event.id}>
                <input type="radio" name="place" value={event.place} checked={place === event.place} onChange={() => setPlace(event.place)} />{' '}
                {event.title} · {event.dateLabel}
              </label>
            ))}
          </fieldset>
          {status === 'error' && (
            <p className="ld-form__error ld-field--wide" role="alert">
              Chưa tạo được link. Kiểm tra mạng, hoặc migration <code>guest_links</code> đã chạy trên Supabase chưa.
            </p>
          )}
          <button type="submit" className="ld-btn ld-btn--primary ld-field--wide" disabled={status === 'sending' || !supabaseConfigured}>
            {status === 'sending' ? 'Đang tạo…' : 'Tạo link'}
          </button>
        </form>

        {latest && (
          <section className="ad-link" aria-live="polite">
            <p className="ad-link__who">
              <strong>{latest.name}</strong> · {eventFor(latest.place)?.title}
            </p>
            <input className="ad-link__url" readOnly value={linkFor(latest.code)} onFocus={(e) => e.currentTarget.select()} />
            <LinkActions link={linkFor(latest.code)} />
          </section>
        )}

        {history.length > 0 && (
          <section className="ad-history">
            <h2>Đã tạo trên máy này ({history.length})</h2>
            <ul>
              {history.map((item) => (
                <li key={item.code}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {eventFor(item.place)?.title} · /g/{item.code}
                    </span>
                  </div>
                  <LinkActions link={linkFor(item.code)} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
