/**
 * Every piece of wedding copy for the whole site — the storybook finale card
 * (part 1) and the landing page (part 2) both read from here.
 *
 * Names, families, dates and venues are real. Still placeholders: RSVP note
 * and bank details.
 * Photos live in `public/assets/landing/`; a missing photo shows a labelled
 * placeholder, so the page works before any photo exists.
 */

export interface Person {
  /** Full name as printed on the invitation. */
  name: string;
  /** Short name used in headings ("Minh & Lan"). */
  shortName: string;
  role: 'Chú rể' | 'Cô dâu';
  /** "Nhà trai" / "Nhà gái". */
  family: string;
  /** Names only: the page puts "Ông Bà" on the line above them. */
  father: string;
  mother: string;
  /** Family home address. */
  home: string;
  photo: string;
}

export interface WeddingEvent {
  id: string;
  /** Value of the `?place=` URL parameter that selects this event for a guest. */
  place: number;
  /** Whose side hosts it (sets the side of an RSVP sent through this event's link). */
  side: 'groom' | 'bride';
  title: string;
  /** ISO start/end with offset, used for the calendar link and countdown. */
  start: string;
  end: string;
  timeLabel: string;
  dateLabel: string;
  lunarDate?: string;
  venueName: string;
  address: string;
  /** Google Maps search query or a full maps URL. */
  map: string;
  note?: string;
}

export interface Photo {
  src: string;
  alt: string;
  /** Layout hint for the gallery grid. */
  shape?: 'portrait' | 'landscape' | 'square';
}

export interface GiftAccount {
  owner: string;
  bank: string;
  number: string;
  qr: string;
}

export interface WishTemplate {
  /** Short chip label. */
  label: string;
  /** Full message; `{groom}` / `{bride}` are replaced with the short names. */
  text: string;
}

export interface WeddingContent {
  isPlaceholder: boolean;
  groom: Person;
  bride: Person;
  /** Default event for the countdown, hero and cards when the URL has no valid `?place=`. */
  mainEventId: string;
  hero: { eyebrow: string; quote: string; quoteSource?: string; photo: string };
  events: WeddingEvent[];
  /** The love story section's YouTube video: any YouTube link (watch, youtu.be, shorts, embed) or the bare id. Empty = no video. */
  video: { youtube: string; title: string };
  /** Background song that starts when the guest taps "Tiếp tục" on the opened card. Empty `src` = no music. */
  music: { src: string; title: string };
  gallery: Photo[];
  rsvp: { deadlineLabel: string; note: string };
  wishes: { intro: string; templates: WishTemplate[] };
  gifts: { intro: string; accounts: GiftAccount[] };
  closing: { title: string; text: string };
}

const P = '/assets/landing';

export const wedding: WeddingContent = {
  isPlaceholder: false,
  groom: {
    name: 'Trịnh Tuấn Dũng',
    shortName: 'Tuấn Dũng',
    role: 'Chú rể',
    family: 'Nhà trai',
    father: 'Trịnh Văn Nghị',
    mother: 'Đào Thị Kim Nhung',
    home: 'Số 3 - Đường Trần Đăng Dinh, P. Trường Vinh, Tỉnh Nghệ An',
    photo: `${P}/couple/groom.jpg`,
  },
  bride: {
    name: 'Hoàng Thị Thanh Mai',
    shortName: 'Hoàng Mai',
    role: 'Cô dâu',
    family: 'Nhà gái',
    father: 'Hoàng Đăng Cường',
    mother: 'Lê Thị Lan',
    home: 'TDP Dương Thịnh, Phường Thượng Hồng, Tỉnh Hưng Yên',
    photo: `${P}/couple/bride.jpg`,
  },
  mainEventId: 'groom-party',
  hero: {
    eyebrow: 'Chúng mình sắp cưới',
    quote: 'Yêu nhau không phải là nhìn nhau, mà là cùng nhìn về một hướng.',
    quoteSource: 'Antoine de Saint-Exupéry',
    photo: `${P}/hero.jpg`,
  },
  // Groom's side first, like everywhere else on the page (`place` keeps the invitation links stable).
  // End times are not on the invitation; they only set the calendar entry length (3 h).
  events: [
    {
      id: 'groom-party',
      place: 2,
      side: 'groom',
      title: 'Tiệc Cưới Nhà Trai',
      start: '2026-11-03T11:00:00+07:00',
      end: '2026-11-03T14:00:00+07:00',
      timeLabel: '11:00',
      dateLabel: 'Thứ Ba, 03.11.2026',
      lunarDate: 'Tức ngày 25 tháng 9 năm Bính Ngọ',
      venueName: 'Trung Tâm Tổ Chức Tiệc Cưới, Sự Kiện, Nhà Hàng Duy Tân Vinh',
      address: 'Số 9C - Đường Phượng Hoàng, Phường Trường Vinh, Tỉnh Nghệ An',
      map: 'https://maps.app.goo.gl/JvBtwvUKJE3YDzJM9',
    },
    {
      id: 'bride-party',
      place: 1,
      side: 'bride',
      title: 'Tiệc Cưới Nhà Gái',
      start: '2026-11-01T16:00:00+07:00',
      end: '2026-11-01T19:00:00+07:00',
      timeLabel: '16:00',
      dateLabel: 'Chủ nhật, 01.11.2026',
      lunarDate: 'Tức ngày 23 tháng 9 năm Bính Ngọ',
      venueName: 'Tư gia nhà gái',
      address: 'TDP Dương Thịnh, Phường Thượng Hồng, Tỉnh Hưng Yên',
      map: 'https://maps.app.goo.gl/xshbMY9ehVv1mTZ97',
    },
  ],
  video: {
    youtube: 'https://youtu.be/e-TeDs6q2YI',
    title: 'Video cưới của Tuấn Dũng & Hoàng Mai',
  },
  music: {
    src: `${P}/audio/lo-thuong-nhau.mp3`,
    title: 'Lỡ Thương Nhau',
  },
  // All studio photos are 2:3 portraits; 18 fills the 3-column (and 2-column mobile) grid evenly.
  gallery: [
    { src: `${P}/gallery/01.jpg`, alt: 'Ảnh cưới 1', shape: 'portrait' },
    { src: `${P}/gallery/02.jpg`, alt: 'Ảnh cưới 2', shape: 'portrait' },
    { src: `${P}/gallery/03.jpg`, alt: 'Ảnh cưới 3', shape: 'portrait' },
    { src: `${P}/gallery/04.jpg`, alt: 'Ảnh cưới 4', shape: 'portrait' },
    { src: `${P}/gallery/05.jpg`, alt: 'Ảnh cưới 5', shape: 'portrait' },
    { src: `${P}/gallery/06.jpg`, alt: 'Ảnh cưới 6', shape: 'portrait' },
    { src: `${P}/gallery/07.jpg`, alt: 'Ảnh cưới 7', shape: 'portrait' },
    { src: `${P}/gallery/08.jpg`, alt: 'Ảnh cưới 8', shape: 'portrait' },
    { src: `${P}/gallery/09.jpg`, alt: 'Ảnh cưới 9', shape: 'portrait' },
    { src: `${P}/gallery/10.jpg`, alt: 'Ảnh cưới 10', shape: 'portrait' },
    { src: `${P}/gallery/11.jpg`, alt: 'Ảnh cưới 11', shape: 'portrait' },
    { src: `${P}/gallery/12.jpg`, alt: 'Ảnh cưới 12', shape: 'portrait' },
    { src: `${P}/gallery/13.jpg`, alt: 'Ảnh cưới 13', shape: 'portrait' },
    { src: `${P}/gallery/14.jpg`, alt: 'Ảnh cưới 14', shape: 'portrait' },
    { src: `${P}/gallery/15.jpg`, alt: 'Ảnh cưới 15', shape: 'portrait' },
    { src: `${P}/gallery/16.jpg`, alt: 'Ảnh cưới 16', shape: 'portrait' },
    { src: `${P}/gallery/17.jpg`, alt: 'Ảnh cưới 17', shape: 'portrait' },
    { src: `${P}/gallery/18.jpg`, alt: 'Ảnh cưới 18', shape: 'portrait' },
  ],
  rsvp: {
    deadlineLabel: 'trước ngày 25.10.2026',
    note: 'Sự hiện diện của bạn là niềm vui lớn nhất của chúng mình.',
  },
  wishes: {
    intro: 'Để lại đôi lời chúc phúc cho chú rể và cô dâu. Chọn nhanh một lời chúc có sẵn bên dưới, hoặc tự viết theo cách của bạn.',
    templates: [
      { label: 'Trăm năm hạnh phúc', text: 'Chúc {groom} và {bride} trăm năm hạnh phúc, đầu bạc răng long, sớm đón thiên thần nhỏ nhé!' },
      {
        label: 'Yêu thương, thấu hiểu',
        text: 'Chúc mừng hạnh phúc hai bạn! Mong hai bạn luôn yêu thương, thấu hiểu và cùng nhau đi hết chặng đường dài phía trước.',
      },
      { label: 'Tổ ấm bình an', text: 'Chúc tổ ấm nhỏ của {groom} và {bride} luôn ngập tràn tiếng cười, bình an và ấm áp.' },
      { label: 'Bách niên giai lão', text: 'Chúc chú rể và cô dâu bách niên giai lão, sắt son một lòng, hạnh phúc viên mãn.' },
      {
        label: 'Mãi như hôm nay',
        text: 'Thật vui khi được chứng kiến ngày trọng đại của hai bạn. Chúc hai bạn mãi hạnh phúc như ngày hôm nay!',
      },
      {
        label: 'Thuận vợ thuận chồng',
        text: 'Chúc hai bạn về chung một nhà, thuận vợ thuận chồng, cùng nhau vun đắp tổ ấm thật vững vàng.',
      },
      { label: 'Sớm có tin vui', text: 'Chúc mừng đám cưới! Chúc hai bạn sớm có tin vui, gia đình đề huề, công việc thuận lợi.' },
      {
        label: 'Nắm tay qua thăng trầm',
        text: 'Gửi lời chúc phúc chân thành nhất đến {groom} và {bride}. Chúc hai bạn luôn nắm chặt tay nhau qua mọi thăng trầm.',
      },
      {
        label: 'Chúc hai gia đình',
        text: 'Chúc mừng hai gia đình có thêm thành viên mới. Chúc đôi uyên ương hạnh phúc, an khang, thịnh vượng.',
      },
      {
        label: 'Chúc từ xa',
        text: 'Tiếc là không thể đến chung vui cùng hai bạn, xin gửi lời chúc từ xa: chúc {groom} và {bride} trăm năm hạnh phúc!',
      },
    ],
  },
  gifts: {
    intro: 'Nếu bạn muốn gửi lời chúc kèm quà mừng, chúng mình xin trân trọng cảm ơn.',
    accounts: [
      { owner: 'TRINH TUAN DUNG', bank: 'MB Bank', number: '7190 1389 58888', qr: `${P}/gift/groom-qr.png` },
      { owner: 'HOANG THI THANH MAI', bank: 'MB Bank', number: '0000 1170 71998', qr: `${P}/gift/bride-qr.png` },
    ],
  },
  closing: {
    title: 'Hẹn gặp bạn trong ngày vui!',
    text: 'Cảm ơn bạn đã dành thời gian xem thiệp của chúng mình.',
  },
};

/** A template with the couple's names filled in. */
export function fillWish(template: WishTemplate, content: WeddingContent): string {
  return template.text.replaceAll('{groom}', content.groom.shortName).replaceAll('{bride}', content.bride.shortName);
}

export function mainEvent(content: WeddingContent): WeddingEvent {
  return content.events.find((e) => e.id === content.mainEventId) ?? content.events[0];
}

/**
 * The event this guest is invited to, from the invitation link:
 * `?place=1` → bride's side, `?place=2` → groom's side (see `place` on each
 * event). Missing or unknown values fall back to `mainEventId`.
 */
export function guestEvent(content: WeddingContent, search: string): WeddingEvent {
  const place = Number(new URLSearchParams(search).get('place'));
  return content.events.find((e) => e.place === place) ?? mainEvent(content);
}

/** The events to show this guest: only theirs with a valid `?place=`, otherwise all of them. */
export function guestEvents(content: WeddingContent, search: string): WeddingEvent[] {
  const place = Number(new URLSearchParams(search).get('place'));
  const own = content.events.filter((e) => e.place === place);
  return own.length ? own : content.events;
}

/** Whose guest this is, from `?place=`: that event's side, or 'both' without a valid place. */
export function guestSide(content: WeddingContent, search: string): 'groom' | 'bride' | 'both' {
  const place = Number(new URLSearchParams(search).get('place'));
  return content.events.find((e) => e.place === place)?.side ?? 'both';
}

/**
 * The guest's name from `?name=` (any letter case, e.g. `?Name=Anh%20Nam`),
 * tidied and capped at 60 characters; '' when absent.
 */
export function guestName(search: string): string {
  for (const [key, value] of new URLSearchParams(search)) {
    if (key.toLowerCase() === 'name') return value.replace(/\s+/g, ' ').trim().slice(0, 60);
  }
  return '';
}

/** The same content, with the guest's event as the one everything points at. */
export function forGuest(content: WeddingContent, search: string): WeddingContent {
  return { ...content, mainEventId: guestEvent(content, search).id };
}

/** Section anchors shared by the storybook card links and the landing nav. */
export const sectionIds = {
  landing: 'thiep-moi',
  couple: 'co-dau-chu-re',
  events: 'su-kien',
  story: 'chuyen-tinh',
  gallery: 'album',
  rsvp: 'xac-nhan',
  wishes: 'loi-chuc',
  gifts: 'mung-cuoi',
} as const;
