import { describe, expect, it } from 'vitest';
import { wedding } from '../../content/wedding';
import { fold, placeFromCell, rowsToGuests } from './importGuests';

const events = wedding.events;
const BRIDE = 1;
const GROOM = 2;

describe('Excel guest import', () => {
  it('folds Vietnamese for matching and search', () => {
    expect(fold('Nhà Gái')).toBe('nha gai');
    expect(fold('Đỗ Thị Hằng')).toBe('do thi hang');
  });

  it('reads the party from a number or from words', () => {
    expect(placeFromCell(1, events, GROOM)).toBe(BRIDE);
    expect(placeFromCell('2', events, BRIDE)).toBe(GROOM);
    expect(placeFromCell('Nhà gái', events, GROOM)).toBe(BRIDE);
    expect(placeFromCell('nha trai', events, BRIDE)).toBe(GROOM);
    expect(placeFromCell('Cô dâu', events, GROOM)).toBe(BRIDE);
    expect(placeFromCell('', events, GROOM)).toBe(GROOM);
    expect(placeFromCell(null, events, BRIDE)).toBe(BRIDE);
    expect(placeFromCell(7, events, BRIDE)).toBeNull();
    expect(placeFromCell('hàng xóm', events, BRIDE)).toBeNull();
  });

  it('finds the columns by their titles', () => {
    const rows = [
      ['STT', 'Bên', 'Họ và tên'],
      [1, 'Nhà gái', '  Cô   Lan '],
      [2, 'Nhà trai', 'Anh Nam'],
      [null, null, null],
      [3, 'bạn bè', 'Chị Hoa'],
    ];
    const { guests, errors } = rowsToGuests(rows, events, GROOM);
    expect(guests).toEqual([
      { name: 'Cô Lan', place: BRIDE, line: 2 },
      { name: 'Anh Nam', place: GROOM, line: 3 },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0].line).toBe(5);
  });

  it('takes column A as the name and B as the party without a header', () => {
    const { guests } = rowsToGuests([['Anh Nam', 2], ['Cô Lan']], events, BRIDE);
    expect(guests).toEqual([
      { name: 'Anh Nam', place: GROOM, line: 1 },
      { name: 'Cô Lan', place: BRIDE, line: 2 },
    ]);
  });

  it('uses the chosen party when the sheet has only names', () => {
    const { guests } = rowsToGuests([['Tên khách'], ['Anh Nam']], events, GROOM);
    expect(guests).toEqual([{ name: 'Anh Nam', place: GROOM, line: 2 }]);
  });
});
