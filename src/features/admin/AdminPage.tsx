import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { wedding } from '../../content/wedding';
import {
  AdminKeyError,
  addGuests,
  adminHasKey,
  adminLogin,
  adminSetKey,
  listGuests,
  updateGuest,
  type Guest,
  type GuestRow,
} from '../landing/lib/guests';
import { supabaseConfigured } from '../landing/lib/supabase';
import { fold, rowsToGuests, type ImportResult } from './importGuests';
import '../landing/landing.css';
import './admin.css';

/** The password stays on this device so /admin opens straight to the list next time. */
const KEY_STORAGE = 'admin:key';

function storedKey(): string {
  try {
    return localStorage.getItem(KEY_STORAGE) ?? '';
  } catch {
    return '';
  }
}

function storeKey(key: string) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    // Storage blocked: the password is asked again next time.
  }
}

const linkFor = (code: string) => `${window.location.origin}/g/${code}`;
const tidy = (name: string) => name.replace(/\s+/g, ' ').trim();
const sameGuest = (a: Guest, b: Guest) => a.place === b.place && fold(tidy(a.name)) === fold(tidy(b.name));

function PlaceSelect({ value, onChange, label }: { value: number; onChange: (place: number) => void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {wedding.events.map((event) => (
        <option key={event.id} value={event.place}>
          {event.title.replace('Tiệc Cưới ', '')} · {event.dateLabel.split(', ').pop()}
        </option>
      ))}
    </select>
  );
}

function CopyLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(linkFor(code));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Sao chép link này:', linkFor(code));
    }
  };
  return (
    <button type="button" className="ld-btn ld-btn--primary lk-copy" onClick={copy}>
      {copied ? 'Đã chép ✓' : 'Copy link'}
    </button>
  );
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** One guest in the list: name and party edited in place, saved when the field is left. */
function GuestListRow({ row, onSave }: { row: GuestRow; onSave: (code: string, guest: Guest) => Promise<void> }) {
  const [name, setName] = useState(row.name);
  const [state, setState] = useState<SaveState>('idle');

  useEffect(() => setName(row.name), [row.name]);

  const save = async (guest: Guest) => {
    const clean = { ...guest, name: tidy(guest.name) };
    if (!clean.name) {
      setName(row.name);
      return;
    }
    if (clean.name === row.name && clean.place === row.place) return;
    setState('saving');
    try {
      await onSave(row.code, clean);
      setState('saved');
      window.setTimeout(() => setState((s) => (s === 'saved' ? 'idle' : s)), 1500);
    } catch {
      setState('error');
    }
  };

  return (
    <li className="lk-row" data-state={state}>
      <input
        className="lk-row__name"
        aria-label="Tên khách"
        maxLength={60}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => save({ name, place: row.place })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') setName(row.name);
        }}
      />
      <PlaceSelect label={`Tiệc của ${row.name}`} value={row.place} onChange={(place) => save({ name, place })} />
      <span className="lk-row__code">
        /g/{row.code}
        <small aria-live="polite">{state === 'saving' ? 'Đang lưu…' : state === 'saved' ? 'Đã lưu' : state === 'error' ? 'Lỗi, thử lại' : ''}</small>
      </span>
      <CopyLinkButton code={row.code} />
    </li>
  );
}

/** Choose the password (first visit) or type it. */
function KeyGate({ hasKey, onKey }: { hasKey: boolean; onKey: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!hasKey) {
        if (key.length < 8) throw new Error('Mật khẩu cần ít nhất 8 ký tự.');
        await adminSetKey(key);
      } else if (!(await adminLogin(key))) {
        throw new Error('Sai mật khẩu.');
      }
      onKey(key);
    } catch (err) {
      setError(err instanceof Error && !err.message.startsWith('Supabase') ? err.message : 'Không kết nối được, thử lại nhé.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="ld-form lk-gate" onSubmit={onSubmit}>
      <label className="ld-field ld-field--wide">
        <span>{hasKey ? 'Mật khẩu quản trị' : 'Đặt mật khẩu quản trị (lần đầu, ít nhất 8 ký tự)'}</span>
        <input
          type="password"
          required
          autoComplete={hasKey ? 'current-password' : 'new-password'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </label>
      {error && (
        <p className="ld-form__error ld-field--wide" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="ld-btn ld-btn--primary ld-field--wide" disabled={busy}>
        {busy ? 'Đang kiểm tra…' : hasKey ? 'Vào' : 'Đặt mật khẩu'}
      </button>
    </form>
  );
}

/** Add one guest by hand. */
function AddGuestForm({ onAdd }: { onAdd: (guests: Guest[]) => Promise<void> }) {
  const [name, setName] = useState('');
  const [place, setPlace] = useState(wedding.events[0].place);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!tidy(name)) return;
    setBusy(true);
    setError(false);
    try {
      await onAdd([{ name: tidy(name), place }]);
      setName('');
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="lk-add" onSubmit={onSubmit}>
      <input aria-label="Tên khách mới" placeholder="Tên khách, VD: Anh Nam" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      <PlaceSelect label="Tiệc của khách mới" value={place} onChange={setPlace} />
      <button type="submit" className="ld-btn ld-btn--primary" disabled={busy}>
        {busy ? 'Đang thêm…' : 'Thêm'}
      </button>
      {error && (
        <p className="ld-form__error" role="alert">
          Chưa thêm được, thử lại nhé.
        </p>
      )}
    </form>
  );
}

/** Pick an .xlsx, check what was read, then add it in one go. */
function ExcelImport({ existing, onAdd }: { existing: GuestRow[]; onAdd: (guests: Guest[]) => Promise<void> }) {
  const [fallback, setFallback] = useState(wedding.events[0].place);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ImportResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setStatus('reading');
    import('read-excel-file/browser')
      .then(({ readSheet }) => readSheet(file))
      .then((rows) => {
        if (cancelled) return;
        setParsed(rowsToGuests(rows, wedding.events, fallback));
        setStatus('idle');
      })
      .catch(() => {
        if (cancelled) return;
        setParsed(null);
        setStatus('error');
        setMessage('Không đọc được file. Cần file Excel .xlsx.');
      });
    return () => {
      cancelled = true;
    };
  }, [file, fallback]);

  const fresh = parsed?.guests.filter((g) => !existing.some((row) => sameGuest(row, g))) ?? [];
  const duplicates = (parsed?.guests.length ?? 0) - fresh.length;

  const confirm = async () => {
    setStatus('saving');
    try {
      await onAdd(fresh.map(({ name, place }) => ({ name, place })));
      setStatus('done');
      setMessage(`Đã thêm ${fresh.length} khách.`);
      setParsed(null);
      setFile(null);
    } catch {
      setStatus('error');
      setMessage('Chưa lưu được, thử lại nhé.');
    }
  };

  return (
    <section className="lk-import">
      <h2>Nhập từ Excel</h2>
      <p className="lk-hint">
        Cột <strong>Tên</strong> (hoặc “Họ và tên”) và cột <strong>Bên</strong> (“Nhà trai”/“Nhà gái” hoặc 2/1). Không có tiêu đề thì cột A là tên,
        cột B là bên.
      </p>
      <div className="lk-import__controls">
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={(e) => {
            setMessage('');
            setFile(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
        <label>
          Dòng không ghi bên: <PlaceSelect label="Tiệc cho dòng không ghi bên" value={fallback} onChange={setFallback} />
        </label>
      </div>
      {status === 'reading' && <p className="lk-hint">Đang đọc file…</p>}
      {message && (
        <p className={status === 'error' ? 'ld-form__error' : 'lk-ok'} role="status">
          {message}
        </p>
      )}
      {parsed && (
        <div className="lk-preview">
          <p>
            <strong>{file?.name}</strong>: {fresh.length} khách mới
            {duplicates > 0 && `, ${duplicates} đã có trong danh sách (bỏ qua)`}
            {parsed.errors.length > 0 && `, ${parsed.errors.length} dòng lỗi`}.
          </p>
          {parsed.errors.length > 0 && (
            <ul className="lk-preview__errors">
              {parsed.errors.map((err) => (
                <li key={err.line}>
                  Dòng {err.line}: {err.message}
                </li>
              ))}
            </ul>
          )}
          <div className="lk-preview__actions">
            <button type="button" className="ld-btn ld-btn--primary" disabled={!fresh.length || status === 'saving'} onClick={confirm}>
              {status === 'saving' ? 'Đang lưu…' : `Thêm ${fresh.length} khách`}
            </button>
            <button
              type="button"
              className="ld-btn ld-btn--ghost"
              onClick={() => {
                setParsed(null);
                setFile(null);
              }}
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/** The guest list once signed in. */
function GuestManager({ adminKey, onSignOut }: { adminKey: string; onSignOut: () => void }) {
  const [rows, setRows] = useState<GuestRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');

  const handle = (err: unknown) => {
    if (err instanceof AdminKeyError) onSignOut();
    throw err;
  };

  useEffect(() => {
    listGuests(adminKey)
      .then(setRows)
      .catch((err) => {
        if (err instanceof AdminKeyError) onSignOut();
        else setLoadError(true);
      });
  }, [adminKey, onSignOut]);

  const add = async (guests: Guest[]) => {
    const added = await addGuests(adminKey, guests).catch(handle);
    setRows((current) => [...added, ...(current ?? [])]);
  };

  const save = async (code: string, guest: Guest) => {
    const updated = await updateGuest(adminKey, code, guest).catch(handle);
    setRows((current) => current?.map((row) => (row.code === code ? updated : row)) ?? null);
  };

  const shown = useMemo(() => {
    const q = fold(query.trim());
    return q ? (rows ?? []).filter((row) => fold(row.name).includes(q) || row.code.includes(q)) : (rows ?? []);
  }, [rows, query]);

  return (
    <>
      <AddGuestForm onAdd={add} />
      <ExcelImport existing={rows ?? []} onAdd={add} />

      <section className="lk-list">
        <div className="lk-list__head">
          <h2>Danh sách khách {rows && `(${query ? `${shown.length}/` : ''}${rows.length})`}</h2>
          <input type="search" className="lk-search" placeholder="Tìm theo tên…" aria-label="Tìm theo tên" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {loadError && (
          <p className="ld-form__error" role="alert">
            Không tải được danh sách, tải lại trang nhé.
          </p>
        )}
        {!rows && !loadError && <p className="lk-hint">Đang tải…</p>}
        {rows && !shown.length && <p className="lk-hint">{query ? 'Không có khách nào khớp.' : 'Chưa có khách nào.'}</p>}
        <ul className="lk-rows">
          {shown.map((row) => (
            <GuestListRow key={row.code} row={row} onSave={save} />
          ))}
        </ul>
      </section>

      <p className="lk-signout">
        <button type="button" className="ld-btn ld-btn--ghost" onClick={onSignOut}>
          Đăng xuất
        </button>
      </p>
    </>
  );
}

/**
 * `/admin`: behind a password, the guest list. Add guests by hand or from an
 * Excel sheet, edit names and parties in place, copy each guest's short
 * `/g/<code>` link (safe to send through Zalo / Messenger).
 */
export function AdminPage() {
  const [adminKey, setAdminKey] = useState(storedKey);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    document.title = 'Quản lý khách mời';
    // Keep the page out of search results.
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);

  useEffect(() => {
    if (adminKey || !supabaseConfigured) return;
    adminHasKey()
      .then(setHasKey)
      .catch(() => setHasKey(true));
  }, [adminKey]);

  const signIn = (key: string) => {
    storeKey(key);
    setAdminKey(key);
  };
  const signOut = useCallback(() => {
    storeKey('');
    setHasKey(true);
    setAdminKey('');
  }, []);

  return (
    <main className="ld lk">
      <div className="ld-card lk-card">
        <h1 className="lk-title">Quản lý khách mời</h1>
        <p className="lk-intro">Mỗi khách có một link ngắn riêng, gửi qua Zalo, Messenger vẫn giữ nguyên.</p>

        {!supabaseConfigured ? (
          <p className="ld-form__error" role="alert">
            Chưa kết nối Supabase (thiếu VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
          </p>
        ) : adminKey ? (
          <GuestManager adminKey={adminKey} onSignOut={signOut} />
        ) : hasKey === null ? (
          <p className="lk-hint">Đang tải…</p>
        ) : (
          <KeyGate hasKey={hasKey} onKey={signIn} />
        )}
      </div>
    </main>
  );
}
