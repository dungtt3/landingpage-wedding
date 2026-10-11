import type { SpriteAnimation } from './sceneTypes';

/**
 * Frame index for a continuous frame cursor (= elapsed seconds × fps).
 * Looping animations wrap; one-shot animations hold the last frame.
 */
export function frameIndexAt(cursor: number, anim: Pick<SpriteAnimation, 'frameCount' | 'loop'>): number {
  const raw = Math.floor(Math.max(0, cursor) + 1e-6);
  return anim.loop ? raw % anim.frameCount : Math.min(raw, anim.frameCount - 1);
}

/** Grid cell of a frame. Column/row counts always come from metadata. */
export function frameCell(index: number, columns: number): { col: number; row: number } {
  return { col: index % columns, row: Math.floor(index / columns) };
}

/**
 * `background-position` percentages for a sheet frame. Percentages keep the
 * crop exact at any display scale (no sub-pixel drift between frames).
 */
export function sheetBackgroundPosition(index: number, columns: number, rows: number): string {
  const { col, row } = frameCell(index, columns);
  const x = columns > 1 ? (col / (columns - 1)) * 100 : 0;
  const y = rows > 1 ? (row / (rows - 1)) * 100 : 0;
  return `${x}% ${y}%`;
}

/** Display box of one frame and the offset that pins the anchor (foot point) to the origin. */
export function spriteBox(anim: SpriteAnimation, scale: number) {
  return {
    width: anim.frameWidth * scale,
    height: anim.frameHeight * scale,
    left: -anim.anchor.x * scale,
    top: -anim.anchor.y * scale,
  };
}

/**
 * Returns a renderer that paints a frame on the element only when it changes.
 * Sheets use background-position; frame sequences toggle child <img> elements.
 */
export function createFrameRenderer(el: HTMLElement, anim: SpriteAnimation) {
  let last = -1;
  const children = anim.kind === 'frames' ? Array.from(el.children) as HTMLElement[] : [];
  return (cursor: number) => {
    const index = frameIndexAt(cursor, anim);
    if (index === last) return;
    last = index;
    if (anim.kind === 'sheet') {
      el.style.backgroundPosition = sheetBackgroundPosition(index, anim.columns, anim.rows);
    } else {
      children.forEach((c, i) => {
        c.style.visibility = i === index ? 'visible' : 'hidden';
      });
    }
    el.dataset.frame = String(index);
  };
}
