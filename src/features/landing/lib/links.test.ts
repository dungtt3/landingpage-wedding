import { describe, expect, it } from 'vitest';
import { forGuest, guestEvent, guestEvents, guestName, guestSide, mainEvent, wedding } from '../../../content/wedding';
import { guestCodeFromPath, searchForGuest } from './guests';
import { countdownParts, googleCalendarUrl, mapsUrl, toCalendarStamp, youtubeId } from './links';

describe('landing helpers', () => {
  it('converts local ISO times to UTC calendar stamps', () => {
    expect(toCalendarStamp('2026-12-20T17:30:00+07:00')).toBe('20261220T103000Z');
  });

  it('builds a Google Calendar link for an event', () => {
    const url = new URL(googleCalendarUrl(mainEvent(wedding), 'Đám cưới'));
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('dates')).toMatch(/^\d{8}T\d{6}Z\/\d{8}T\d{6}Z$/);
  });

  it('keeps full map URLs and encodes plain addresses', () => {
    expect(mapsUrl('https://maps.app.goo.gl/x')).toBe('https://maps.app.goo.gl/x');
    expect(mapsUrl('12 Phố Huế, Hà Nội')).toContain('query=12%20Ph');
  });

  it('splits the remaining time and stops at zero', () => {
    const t = Date.UTC(2026, 0, 2);
    expect(countdownParts(t, t - (86400 + 3600 + 61) * 1000)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1, done: false });
    expect(countdownParts(t, t + 5000).done).toBe(true);
  });

  it("picks the guest's party from ?place= and falls back to the main event", () => {
    expect(guestEvent(wedding, '?place=1').id).toBe('bride-party');
    expect(guestEvent(wedding, '?place=2').id).toBe('groom-party');
    expect(guestEvent(wedding, '?place=9').id).toBe(wedding.mainEventId);
    expect(guestEvent(wedding, '').id).toBe(wedding.mainEventId);
    expect(mainEvent(forGuest(wedding, '?place=1&debug')).start).toBe('2026-11-01T16:00:00+07:00');
  });

  it("takes the RSVP side from ?place= and 'both' without one", () => {
    expect(guestSide(wedding, '?place=1')).toBe('bride');
    expect(guestSide(wedding, '?place=2')).toBe('groom');
    expect(guestSide(wedding, '?place=9')).toBe('both');
    expect(guestSide(wedding, '')).toBe('both');
  });

  it("shows only the guest's own event with a valid ?place=, every event otherwise", () => {
    expect(guestEvents(wedding, '?place=1').map((e) => e.id)).toEqual(['bride-party']);
    expect(guestEvents(wedding, '?place=2').map((e) => e.id)).toEqual(['groom-party']);
    expect(guestEvents(wedding, '?place=9')).toEqual(wedding.events);
    expect(guestEvents(wedding, '')).toEqual(wedding.events);
  });

  it('reads the guest name from ?name= in any letter case', () => {
    expect(guestName('?Name=Anh%20Nam&place=2')).toBe('Anh Nam');
    expect(guestName('?name=++C%C3%B4++Lan++')).toBe('Cô Lan');
    expect(guestName('?NAME=' + 'x'.repeat(80))).toHaveLength(60);
    expect(guestName('?place=1')).toBe('');
  });

  it('survives links mangled by Zalo / Messenger', () => {
    // Zalo appends its own query with a second `?`.
    expect(guestEvent(wedding, '?place=1?zarsrc=31&utm_source=zalo').id).toBe('bride-party');
    expect(guestName('?place=2&name=Anh%20Nam?zarsrc=30')).toBe('Anh Nam');
    // `&` escaped to `&amp;`.
    expect(guestName('?place=2&amp;name=Anh%20Nam')).toBe('Anh Nam');
    expect(guestSide(wedding, '?name=Lan&amp;place=1')).toBe('bride');
    // Percent-encoded twice.
    expect(guestName('?name=C%25C3%25B4%2520Lan')).toBe('Cô Lan');
    // Messenger's fbclid and trailing junk on the number.
    expect(guestEvent(wedding, '?place=2/&fbclid=IwAR0abc').id).toBe('groom-party');
    // A literal % that is not an escape stays as typed.
    expect(guestName('?name=100%25%20vui')).toBe('100% vui');
  });

  it('reads the code from a /g/<code> link, ignoring what chat apps glue on', () => {
    expect(guestCodeFromPath('/g/ab3kx9')).toBe('ab3kx9');
    expect(guestCodeFromPath('/g/AB3KX9/')).toBe('ab3kx9');
    expect(guestCodeFromPath('/g/ab3kx9.')).toBe('ab3kx9');
    expect(guestCodeFromPath('/g/ab3')).toBeNull();
    expect(guestCodeFromPath('/admin')).toBeNull();
  });

  it('turns a looked-up guest into the query the guest helpers read', () => {
    const search = searchForGuest({ name: 'Cô Lan & chú Hùng', place: 1 });
    expect(guestName(search)).toBe('Cô Lan & chú Hùng');
    expect(guestEvent(wedding, search).id).toBe('bride-party');
  });

  it('gives every event a unique place number', () => {
    const places = wedding.events.map((e) => e.place);
    expect(new Set(places).size).toBe(places.length);
  });

  it('points the main event id at a real event', () => {
    expect(wedding.events.some((e) => e.id === wedding.mainEventId)).toBe(true);
  });

  it('reads the video id from any YouTube link', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?si=abc&v=dQw4w9WgXcQ&t=10',
      'https://youtu.be/dQw4w9WgXcQ?si=xyz',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'dQw4w9WgXcQ',
    ]) {
      expect(youtubeId(url), url).toBe('dQw4w9WgXcQ');
    }
    expect(youtubeId('')).toBeNull();
    expect(youtubeId('https://example.com/video')).toBeNull();
  });
});
