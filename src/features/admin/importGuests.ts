import type { WeddingEvent } from '../../content/wedding';
import type { Guest } from '../landing/lib/guests';

/** One cell as the Excel reader hands it over. */
type Cell = string | number | boolean | Date | object | null | undefined;

export interface ImportResult {
  /** Guests ready to add; `line` is the row number in Excel (1-based). */
  guests: (Guest & { line: number })[];
  /** Rows that could not be read, to show before anything is saved. */
  errors: { line: number; message: string }[];
}

/** Lower-case, accents and đ removed: "Nhà Gái" → "nha gai". For matching and search. */
export function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

const cellText = (cell: Cell): string => (cell == null ? '' : cell instanceof Date ? cell.toISOString() : String(cell)).replace(/\s+/g, ' ').trim();

const NAME_HEADER = /^(ho\s*(va\s*)?)?ten|name|khach/;
const PLACE_HEADER = /place|ben|tiec|nha|moi|noi/;

/**
 * The party a cell names: its `place` number ("1", 2), or a side in words
 * ("Nhà gái", "trai", "cô dâu", "groom"). Empty → `fallback`; unknown → null.
 */
export function placeFromCell(cell: Cell, events: WeddingEvent[], fallback: number): number | null {
  const text = fold(cellText(cell));
  if (!text) return fallback;
  if (/^\d+$/.test(text)) {
    const place = Number(text);
    return events.some((e) => e.place === place) ? place : null;
  }
  const side = /gai|co dau|bride/.test(text) ? 'bride' : /trai|chu re|groom/.test(text) ? 'groom' : null;
  return events.find((e) => e.side === side)?.place ?? null;
}

/**
 * Reads guests from a sheet. With a header row, the columns are found by
 * title ("Tên"/"Họ và tên"/"Name", "Bên"/"Tiệc"/"Place"); without one, column
 * A is the name and column B the party. A missing party uses `fallback`.
 */
export function rowsToGuests(rows: Cell[][], events: WeddingEvent[], fallback: number): ImportResult {
  const result: ImportResult = { guests: [], errors: [] };
  const first = rows.findIndex((row) => row.some((cell) => cellText(cell)));
  if (first < 0) return result;

  const titles = rows[first].map((cell) => fold(cellText(cell)));
  const nameTitle = titles.findIndex((t) => NAME_HEADER.test(t));
  const hasHeader = nameTitle >= 0;
  const nameCol = hasHeader ? nameTitle : 0;
  const placeTitle = titles.findIndex((t, i) => i !== nameCol && PLACE_HEADER.test(t));
  const placeCol = hasHeader ? placeTitle : 1;

  rows.slice(hasHeader ? first + 1 : first).forEach((row, i) => {
    const line = (hasHeader ? first + 2 : first + 1) + i;
    const name = cellText(row[nameCol]);
    if (!name) return;
    if (name.length > 60) {
      result.errors.push({ line, message: `Tên dài quá 60 ký tự: “${name.slice(0, 30)}…”` });
      return;
    }
    const place = placeCol >= 0 ? placeFromCell(row[placeCol], events, fallback) : fallback;
    if (place === null) {
      result.errors.push({ line, message: `Không hiểu bên/tiệc “${cellText(row[placeCol])}” của ${name}` });
      return;
    }
    result.guests.push({ name, place, line });
  });
  return result;
}
