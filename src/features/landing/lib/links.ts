import type { WeddingEvent } from '../../../content/wedding';

/** `2026-12-20T17:30:00+07:00` → `20261220T103000Z` (Google Calendar format). */
export function toCalendarStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(event: WeddingEvent, title: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarStamp(event.start)}/${toCalendarStamp(event.end)}`,
    location: `${event.venueName}, ${event.address}`,
    details: event.note ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Accepts either a full maps URL or a plain address/search query. */
export function mapsUrl(map: string): string {
  if (/^https?:\/\//.test(map)) return map;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map)}`;
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function countdownParts(targetMs: number, nowMs: number): CountdownParts {
  const left = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: Math.floor(left / 86400),
    hours: Math.floor((left % 86400) / 3600),
    minutes: Math.floor((left % 3600) / 60),
    seconds: left % 60,
    done: left === 0,
  };
}

/** The video id from any YouTube link (watch?v=, youtu.be/, shorts/, embed/, live/) or a bare id; null if none. */
export function youtubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}
