/**
 * Generated placeholder art.
 *
 * Every placeholder is an SVG data URI that is visibly stamped
 * "PLACEHOLDER · <asset id>" so it can never be mistaken for production art.
 * Shapes are deliberately simple paper-cut silhouettes — enough to judge
 * layer order, depth, framing and motion, not a substitute for the artwork.
 */
import type { AssetEntry, PlaceholderSpec, SpriteSheetAnimation } from './sceneTypes';

type Rand = () => number;

function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function label(id: string, w: number, h: number, position: 'bottom' | 'center' = 'bottom'): string {
  const size = Math.max(14, Math.min(42, Math.min(w, h) * 0.05));
  const text = `PLACEHOLDER · ${id}`;
  const boxW = text.length * size * 0.58 + size * 1.2;
  const boxH = size * 1.7;
  const x = (w - boxW) / 2;
  const y = position === 'center' ? (h - boxH) / 2 : h - boxH - Math.max(8, h * 0.04);
  return `<g font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${r1(size)}" font-weight="700">
<rect x="${r1(x)}" y="${r1(y)}" width="${r1(boxW)}" height="${r1(boxH)}" rx="${r1(boxH / 2)}" fill="rgba(40,20,30,.62)"/>
<text x="${r1(w / 2)}" y="${r1(y + boxH * 0.66)}" fill="#fff" text-anchor="middle" letter-spacing=".04em">${text}</text></g>`;
}

function frame(w: number, h: number): string {
  const s = Math.max(2, Math.min(w, h) * 0.006);
  return `<rect x="${s / 2}" y="${s / 2}" width="${w - s}" height="${h - s}" fill="none" stroke="rgba(90,40,60,.45)" stroke-width="${s}" stroke-dasharray="${s * 6} ${s * 4}"/>`;
}

function wrap(w: number, h: number, body: string, id: string, opts: { flip?: boolean; labelPos?: 'bottom' | 'center' } = {}): string {
  const content = opts.flip ? `<g transform="translate(${w} 0) scale(-1 1)">${body}</g>` : body;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="none">${content}${frame(w, h)}${label(id, w, h, opts.labelPos)}</svg>`;
}

/* ----------------------------------------------------------------- shapes */

function hillPath(w: number, h: number, baseY: number, amp: number, waves: number, rand: Rand): string {
  let d = `M0 ${h} L0 ${r1(baseY)}`;
  const steps = waves * 2;
  for (let i = 1; i <= steps; i++) {
    const x = (w * i) / steps;
    const cx = x - w / steps / 2;
    const cy = baseY + (i % 2 ? -amp : amp * 0.4) * (0.6 + rand() * 0.6);
    d += ` Q${r1(cx)} ${r1(cy)} ${r1(x)} ${r1(baseY + (rand() - 0.5) * amp * 0.3)}`;
  }
  return `${d} L${w} ${h} Z`;
}

function mountainRow(w: number, h: number, baseY: number, peak: number, count: number, rand: Rand, fill: string, opacity: number): string {
  let d = `M0 ${h} L0 ${r1(baseY)}`;
  for (let i = 0; i < count; i++) {
    const x0 = (w * i) / count;
    const x1 = (w * (i + 1)) / count;
    const px = x0 + (x1 - x0) * (0.3 + rand() * 0.4);
    d += ` L${r1(px)} ${r1(baseY - peak * (0.5 + rand() * 0.5))} L${r1(x1)} ${r1(baseY - rand() * peak * 0.15)}`;
  }
  return `<path d="${d} L${w} ${h} Z" fill="${fill}" opacity="${opacity}"/>`;
}

function blossom(cx: number, cy: number, r: number, petal: string, center: string): string {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    s += `<circle cx="${r1(cx + Math.cos(a) * r * 0.6)}" cy="${r1(cy + Math.sin(a) * r * 0.6)}" r="${r1(r * 0.55)}" fill="${petal}"/>`;
  }
  return `${s}<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.35)}" fill="${center}"/>`;
}

function leaf(cx: number, cy: number, len: number, angle: number, fill: string): string {
  return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(len)}" ry="${r1(len * 0.38)}" fill="${fill}" transform="rotate(${r1(angle)} ${r1(cx)} ${r1(cy)})"/>`;
}

function shapeBody(spec: PlaceholderSpec, w: number, h: number): { body: string; labelPos?: 'bottom' | 'center' } {
  const p = spec.palette;
  const rand = mulberry32(spec.seed ?? 1);
  switch (spec.shape) {
    case 'sky':
    case 'mountains': {
      const stops = [...p].reverse().map((c, i, a) => `<stop offset="${i / Math.max(1, a.length - 1)}" stop-color="${c}"/>`).join('');
      let body = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`;
      const count = Math.max(3, Math.round(w / 420));
      body += mountainRow(w, h, h * 0.78, h * 0.28, count, rand, p[2] ?? '#aab', 0.45);
      if (spec.shape === 'mountains') body += mountainRow(w, h, h * 0.86, h * 0.22, count + 2, rand, p[3] ?? '#889', 0.55);
      return { body, labelPos: 'center' };
    }
    case 'hills':
    case 'path': {
      let body = '';
      p.slice(0, 3).forEach((c, i) => {
        body += `<path d="${hillPath(w, h, h * (0.25 + i * 0.22), h * 0.16, 2 + i, rand)}" fill="${c}"/>`;
      });
      if (spec.shape === 'path') {
        body += `<path d="M0 ${r1(h * 0.78)} C${r1(w * 0.25)} ${r1(h * 0.62)} ${r1(w * 0.5)} ${r1(h * 0.9)} ${r1(w * 0.75)} ${r1(h * 0.72)} S${w} ${r1(h * 0.7)} ${w} ${r1(h * 0.7)}" fill="none" stroke="#f3e6cf" stroke-width="${r1(h * 0.09)}" stroke-linecap="round"/>`;
      }
      return { body };
    }
    case 'cloud': {
      let body = '';
      const n = 6;
      for (let i = 0; i < n; i++) {
        const cx = w * (0.15 + (0.7 * i) / (n - 1));
        const rr = h * (0.22 + rand() * 0.18);
        body += `<circle cx="${r1(cx)}" cy="${r1(h * 0.62 - rr * 0.4)}" r="${r1(rr)}" fill="${p[0]}"/>`;
      }
      body += `<rect x="${r1(w * 0.1)}" y="${r1(h * 0.55)}" width="${r1(w * 0.8)}" height="${r1(h * 0.25)}" rx="${r1(h * 0.12)}" fill="${p[1] ?? p[0]}"/>`;
      return { body };
    }
    case 'sun':
    case 'glow': {
      const body = `<defs><radialGradient id="s"><stop offset="0" stop-color="${p[0]}" stop-opacity="1"/><stop offset=".45" stop-color="${p[1] ?? p[0]}" stop-opacity="${spec.shape === 'sun' ? 0.85 : 0.5}"/><stop offset="1" stop-color="${p[1] ?? p[0]}" stop-opacity="0"/></radialGradient></defs><circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2}" fill="url(#s)"/>`;
      return { body, labelPos: 'center' };
    }
    case 'tree': {
      const trunkW = w * 0.12;
      let body = `<path d="M${r1(w / 2 - trunkW / 2)} ${h} L${r1(w / 2 - trunkW * 0.3)} ${r1(h * 0.45)} L${r1(w / 2 + trunkW * 0.3)} ${r1(h * 0.45)} L${r1(w / 2 + trunkW / 2)} ${h} Z" fill="${p[2]}"/>`;
      for (let i = 0; i < 14; i++) {
        const cx = w * (0.18 + rand() * 0.64);
        const cy = h * (0.12 + rand() * 0.4);
        body += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(w * (0.12 + rand() * 0.1))}" fill="${i % 3 ? p[0] : p[1]}"/>`;
      }
      for (let i = 0; i < 18; i++) {
        body += `<circle cx="${r1(w * (0.15 + rand() * 0.7))}" cy="${r1(h * (0.08 + rand() * 0.48))}" r="${r1(w * 0.018)}" fill="#fff6ee" opacity=".8"/>`;
      }
      return { body };
    }
    case 'lantern': {
      const body = `<line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${r1(h * 0.3)}" stroke="#7a5a43" stroke-width="${r1(w * 0.03)}"/>
<rect x="${r1(w * 0.3)}" y="${r1(h * 0.28)}" width="${r1(w * 0.4)}" height="${r1(h * 0.05)}" rx="4" fill="${p[1]}"/>
<ellipse cx="${w / 2}" cy="${r1(h * 0.55)}" rx="${r1(w * 0.42)}" ry="${r1(h * 0.24)}" fill="${p[0]}"/>
<ellipse cx="${w / 2}" cy="${r1(h * 0.55)}" rx="${r1(w * 0.18)}" ry="${r1(h * 0.24)}" fill="none" stroke="${p[1]}" stroke-width="3"/>
<ellipse cx="${w / 2}" cy="${r1(h * 0.55)}" rx="${r1(w * 0.3)}" ry="${r1(h * 0.16)}" fill="${p[2]}" opacity=".45"/>
<rect x="${r1(w * 0.3)}" y="${r1(h * 0.78)}" width="${r1(w * 0.4)}" height="${r1(h * 0.05)}" rx="4" fill="${p[1]}"/>
<path d="M${r1(w * 0.42)} ${r1(h * 0.83)} L${r1(w * 0.38)} ${r1(h * 0.98)} L${r1(w * 0.62)} ${r1(h * 0.98)} L${r1(w * 0.58)} ${r1(h * 0.83)} Z" fill="#b3384a"/>`;
      return { body, labelPos: 'center' };
    }
    case 'flowers':
    case 'grass': {
      let body = '';
      const isGrass = spec.shape === 'grass';
      const green = isGrass ? p[0] : p[3] ?? '#7aa074';
      const blades = isGrass ? Math.round(w / 18) : 40;
      for (let i = 0; i < blades; i++) {
        const x = isGrass ? (w * i) / blades : w * rand() * 0.85;
        const bh = h * (isGrass ? 0.45 + rand() * 0.55 : 0.3 + rand() * 0.6) * (isGrass ? 1 : 1 - x / w * 0.6);
        const lean = (rand() - 0.5) * (isGrass ? 40 : 120);
        body += `<path d="M${r1(x - 10)} ${h} Q${r1(x + lean / 2)} ${r1(h - bh * 0.6)} ${r1(x + lean)} ${r1(h - bh)} Q${r1(x + lean / 2 + 6)} ${r1(h - bh * 0.5)} ${r1(x + 12)} ${h} Z" fill="${i % 2 ? green : isGrass ? p[1] : '#5f7f5c'}"/>`;
      }
      const flowers = isGrass ? Math.round(w / 140) : 16;
      for (let i = 0; i < flowers; i++) {
        const x = isGrass ? w * rand() : w * rand() * 0.75;
        const y = isGrass ? h * (0.35 + rand() * 0.4) : h * (0.25 + rand() * 0.6) + (x / w) * h * 0.25;
        const r = isGrass ? h * 0.05 : w * (0.035 + rand() * 0.03);
        body += blossom(x, Math.min(y, h * 0.95), r, i % 3 ? p[0] : isGrass ? p[2] : p[1], '#f6d36b');
      }
      return { body };
    }
    case 'branch': {
      let body = `<path d="M${r1(w * 0.02)} 0 C${r1(w * 0.3)} ${r1(h * 0.5)} ${r1(w * 0.6)} ${r1(h * 0.25)} ${r1(w * 0.98)} ${r1(h * 0.7)}" fill="none" stroke="#6b4f3b" stroke-width="${r1(h * 0.05)}" stroke-linecap="round"/>`;
      for (let i = 0; i < 40; i++) {
        const t = rand();
        const x = w * (0.02 + t * 0.96);
        const y = h * (0.05 + Math.sin(t * Math.PI) * 0.35 + t * 0.3) + (rand() - 0.5) * h * 0.3;
        body += i % 4 === 0 ? blossom(x, y, h * 0.04, p[2], '#f6d36b') : leaf(x, y, h * 0.09, rand() * 180, i % 2 ? p[0] : p[1]);
      }
      return { body };
    }
    case 'house': {
      const body = `<rect x="${r1(w * 0.16)}" y="${r1(h * 0.42)}" width="${r1(w * 0.68)}" height="${r1(h * 0.58)}" fill="${p[0]}"/>
<path d="M${r1(w * 0.06)} ${r1(h * 0.46)} L${r1(w / 2)} ${r1(h * 0.06)} L${r1(w * 0.94)} ${r1(h * 0.46)} Z" fill="${p[1]}"/>
<rect x="${r1(w * 0.43)}" y="${r1(h * 0.66)}" width="${r1(w * 0.14)}" height="${r1(h * 0.34)}" fill="${p[2]}"/>
<rect x="${r1(w * 0.24)}" y="${r1(h * 0.56)}" width="${r1(w * 0.12)}" height="${r1(h * 0.12)}" fill="#f6d36b"/>
<rect x="${r1(w * 0.64)}" y="${r1(h * 0.56)}" width="${r1(w * 0.12)}" height="${r1(h * 0.12)}" fill="#f6d36b"/>`;
      return { body, labelPos: 'center' };
    }
    case 'arch': {
      const pw = w * 0.1;
      let body = `<rect x="${r1(w * 0.1)}" y="${r1(h * 0.45)}" width="${r1(pw)}" height="${r1(h * 0.55)}" fill="${p[0]}"/>
<rect x="${r1(w * 0.8)}" y="${r1(h * 0.45)}" width="${r1(pw)}" height="${r1(h * 0.55)}" fill="${p[0]}"/>
<path d="M${r1(w * 0.1)} ${r1(h * 0.47)} A${r1(w * 0.4)} ${r1(h * 0.4)} 0 0 1 ${r1(w * 0.9)} ${r1(h * 0.47)}" fill="none" stroke="${p[0]}" stroke-width="${r1(pw)}"/>`;
      for (let i = 0; i < 70; i++) {
        const a = Math.PI + rand() * Math.PI;
        const onArch = rand() < 0.7;
        const x = onArch ? w / 2 + Math.cos(a) * w * 0.4 : w * (rand() < 0.5 ? 0.15 : 0.85) + (rand() - 0.5) * pw;
        const y = onArch ? h * 0.47 + Math.sin(a) * h * 0.4 : h * (0.45 + rand() * 0.5);
        body += i % 3 ? leaf(x, y, w * 0.035, rand() * 180, p[2]) : blossom(x, y, w * 0.03, p[1], p[3]);
      }
      return { body };
    }
    case 'fence': {
      let body = `<rect x="0" y="${r1(h * 0.3)}" width="${w}" height="${r1(h * 0.1)}" fill="${p[1]}"/><rect x="0" y="${r1(h * 0.62)}" width="${w}" height="${r1(h * 0.1)}" fill="${p[1]}"/>`;
      const posts = Math.round(w / 110);
      for (let i = 0; i <= posts; i++) {
        const x = (w * i) / posts;
        body += `<path d="M${r1(x - 14)} ${h} L${r1(x - 14)} ${r1(h * 0.12)} L${r1(x)} 0 L${r1(x + 14)} ${r1(h * 0.12)} L${r1(x + 14)} ${h} Z" fill="${p[0]}"/>`;
      }
      return { body, labelPos: 'center' };
    }
    case 'petals': {
      let body = '';
      for (let i = 0; i < 46; i++) {
        const x = w * rand();
        const y = h * rand();
        const s = 10 + rand() * 14;
        body += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(s)}" ry="${r1(s * 0.55)}" fill="${p[i % 2]}" opacity="${r1(0.55 + rand() * 0.4)}" transform="rotate(${r1(rand() * 180)} ${r1(x)} ${r1(y)})"/>`;
      }
      return { body, labelPos: 'center' };
    }
    case 'curtain': {
      let body = `<rect x="${r1(w * 0.08)}" y="0" width="${r1(w * 0.84)}" height="${h}" fill="${p[0]}"/>`;
      for (let i = 0; i < 220; i++) {
        const edge = rand() < 0.5 ? rand() * 0.16 : 0.84 + rand() * 0.16;
        const x = w * (rand() < 0.35 ? edge : rand());
        const y = h * rand();
        body += i % 7 === 0 ? blossom(x, y, h * 0.03, p[2], '#f6d36b') : leaf(x, y, h * 0.07, rand() * 180, i % 2 ? p[0] : p[1]);
      }
      return { body, labelPos: 'center' };
    }
    case 'paper': {
      let body = `<defs><radialGradient id="v" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#v)"/>`;
      for (let i = 0; i < 60; i++) {
        const y = h * rand();
        body += `<line x1="0" y1="${r1(y)}" x2="${w}" y2="${r1(y + (rand() - 0.5) * 30)}" stroke="${p[2]}" stroke-opacity=".07" stroke-width="${r1(1 + rand() * 2)}"/>`;
      }
      return { body, labelPos: 'bottom' };
    }
    case 'envelope-body': {
      const body = `<rect width="${w}" height="${h}" rx="${r1(w * 0.02)}" fill="${p[0]}"/>
<path d="M0 ${h} L${r1(w / 2)} ${r1(h * 0.48)} L${w} ${h} Z" fill="${p[1]}"/>
<path d="M0 0 L${r1(w * 0.5)} ${r1(h * 0.55)} L0 ${h} Z" fill="${p[1]}" opacity=".55"/>
<path d="M${w} 0 L${r1(w * 0.5)} ${r1(h * 0.55)} L${w} ${h} Z" fill="${p[1]}" opacity=".55"/>
<rect width="${w}" height="${h}" rx="${r1(w * 0.02)}" fill="none" stroke="${p[2]}" stroke-width="4"/>`;
      return { body, labelPos: 'bottom' };
    }
    case 'envelope-flap': {
      const body = `<path d="M0 0 L${w} 0 L${r1(w / 2)} ${h} Z" fill="${p[0]}" stroke="${p[2]}" stroke-width="4" stroke-linejoin="round"/><path d="M${r1(w * 0.08)} 6 L${r1(w * 0.92)} 6 L${r1(w / 2)} ${r1(h * 0.9)} Z" fill="${p[1]}" opacity=".35"/>`;
      return { body, labelPos: 'center' };
    }
    case 'envelope-seal': {
      let d = '';
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const rr = w * (i % 2 ? 0.44 : 0.48);
        d += `${i ? 'L' : 'M'}${r1(w / 2 + Math.cos(a) * rr)} ${r1(h / 2 + Math.sin(a) * rr)} `;
      }
      const body = `<path d="${d}Z" fill="${p[0]}"/><circle cx="${w / 2}" cy="${h / 2}" r="${r1(w * 0.33)}" fill="${p[1]}"/>
<path d="M${w / 2} ${r1(h * 0.66)} C${r1(w * 0.25)} ${r1(h * 0.5)} ${r1(w * 0.36)} ${r1(h * 0.3)} ${w / 2} ${r1(h * 0.42)} C${r1(w * 0.64)} ${r1(h * 0.3)} ${r1(w * 0.75)} ${r1(h * 0.5)} ${w / 2} ${r1(h * 0.66)} Z" fill="${p[2]}"/>`;
      return { body, labelPos: 'center' };
    }
    case 'letter': {
      let body = `<rect width="${w}" height="${h}" rx="12" fill="${p[0]}"/><rect x="24" y="24" width="${w - 48}" height="${h - 48}" rx="8" fill="none" stroke="${p[2]}" stroke-width="3"/>`;
      for (let i = 0; i < 5; i++) {
        const lw = w * (0.5 - i * 0.06);
        body += `<rect x="${r1((w - lw) / 2)}" y="${r1(h * (0.2 + i * 0.1))}" width="${r1(lw)}" height="10" rx="5" fill="${p[1]}"/>`;
      }
      return { body, labelPos: 'bottom' };
    }
    case 'sprite-couple':
      return { body: drawCouple(w / 2, h * 0.95, h / 480, 'idle', 0, 1) };
  }
}

export function placeholderForEntry(entry: AssetEntry): string | null {
  if (!entry.placeholder) return null;
  const w = entry.width || 512;
  const h = entry.height || 512;
  const { body, labelPos } = shapeBody(entry.placeholder, w, h);
  return svgToDataUri(wrap(w, h, body, entry.id, { flip: entry.placeholder.flip, labelPos }));
}

/* ------------------------------------------------------------ sprite sheet */

/**
 * Draws a simple couple (groom left, bride right) with the feet at (fx, fy).
 * `phase` (0–1) drives legs/arms so consecutive frames form a real cycle.
 */
function drawCouple(fx: number, fy: number, k: number, state: string, phase: number, frames: number): string {
  const a = phase * Math.PI * 2;
  const isWalk = state === 'walk';
  const isPose = state === 'pose';
  const bob = isWalk ? Math.abs(Math.sin(a)) * 8 * k : Math.sin(a) * 3 * k;
  const swing = isWalk ? Math.sin(a) * 24 : 0;
  const person = (dx: number, suit: string, skirt: boolean, wave: number) => {
    const x = fx + dx * k;
    const hipY = fy - 150 * k - bob;
    const shoulderY = fy - 290 * k - bob;
    const legs = skirt
      ? `<path d="M${r1(x - 62 * k)} ${r1(fy)} L${r1(x - 34 * k)} ${r1(shoulderY + 40 * k)} L${r1(x + 34 * k)} ${r1(shoulderY + 40 * k)} L${r1(x + 62 * k + swing * 0.6 * k)} ${r1(fy)} Z" fill="${suit}" stroke="#d8c8c8" stroke-width="${r1(3 * k)}"/>`
      : [-1, 1]
          .map((side) => {
            const ang = (side * swing * Math.PI) / 180;
            const lx = x + side * 14 * k;
            const footX = lx + Math.sin(ang) * 150 * k;
            const footY = hipY + Math.cos(ang) * 150 * k;
            return `<line x1="${r1(lx)}" y1="${r1(hipY)}" x2="${r1(footX)}" y2="${r1(Math.min(footY, fy))}" stroke="#2f2a3a" stroke-width="${r1(22 * k)}" stroke-linecap="round"/>`;
          })
          .join('');
    const torso = skirt
      ? ''
      : `<rect x="${r1(x - 38 * k)}" y="${r1(shoulderY)}" width="${r1(76 * k)}" height="${r1(150 * k)}" rx="${r1(18 * k)}" fill="${suit}"/>`;
    const armAng = isWalk ? -swing * 0.8 : isPose ? -40 - wave * 70 : Math.sin(a) * 4;
    const armRad = (armAng * Math.PI) / 180;
    const outer = dx < 0 ? -1 : 1;
    const ax = x + outer * 36 * k;
    const ay = shoulderY + 14 * k;
    const arm = `<line x1="${r1(ax)}" y1="${r1(ay)}" x2="${r1(ax + outer * Math.sin(-armRad) * 110 * k)}" y2="${r1(ay + Math.cos(armRad) * 110 * k)}" stroke="${skirt ? '#f1d3bd' : suit}" stroke-width="${r1(18 * k)}" stroke-linecap="round"/>`;
    const head = `<circle cx="${r1(x)}" cy="${r1(shoulderY - 52 * k)}" r="${r1(44 * k)}" fill="#f1d3bd"/>
<path d="M${r1(x - 46 * k)} ${r1(shoulderY - 60 * k)} Q${r1(x)} ${r1(shoulderY - 130 * k)} ${r1(x + 46 * k)} ${r1(shoulderY - 60 * k)}" fill="${skirt ? '#4a3328' : '#2b2420'}"/>`;
    const veil = skirt ? `<path d="M${r1(x + 30 * k)} ${r1(shoulderY - 90 * k)} Q${r1(x + 90 * k)} ${r1(shoulderY)} ${r1(x + 70 * k)} ${r1(shoulderY + 120 * k)}" fill="none" stroke="#ffffff" stroke-opacity=".8" stroke-width="${r1(16 * k)}"/>` : '';
    return legs + torso + arm + head + veil;
  };
  const hands = `<line x1="${r1(fx - 40 * k)}" y1="${r1(fy - 170 * k - bob)}" x2="${r1(fx + 40 * k)}" y2="${r1(fy - 170 * k - bob)}" stroke="#f1d3bd" stroke-width="${r1(16 * k)}" stroke-linecap="round"/>`;
  const wave = isPose ? (Math.sin(a) + 1) / 2 : 0;
  const shadow = `<ellipse cx="${r1(fx)}" cy="${r1(fy)}" rx="${r1(150 * k)}" ry="${r1(14 * k)}" fill="#000" opacity=".15"/>`;
  void frames;
  return shadow + person(-70, '#2f3a4f', false, wave) + person(70, '#fffaf6', true, 0) + hands;
}

export function placeholderSpriteSheet(id: string, anim: SpriteSheetAnimation): string {
  const { frameWidth: fw, frameHeight: fh, columns, rows, frameCount } = anim;
  const w = fw * columns;
  const h = fh * rows;
  const k = Math.min(fw / 360, fh / 480);
  let cells = '';
  for (let i = 0; i < frameCount; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const ox = col * fw;
    const oy = row * fh;
    const fx = ox + anim.anchor.x;
    const fy = oy + anim.anchor.y;
    cells += `<rect x="${ox + 1}" y="${oy + 1}" width="${fw - 2}" height="${fh - 2}" fill="none" stroke="rgba(90,40,60,.35)" stroke-width="2" stroke-dasharray="8 6"/>`;
    cells += drawCouple(fx, fy, k, anim.state, i / frameCount, frameCount);
    cells += `<path d="M${fx - 10} ${fy} L${fx + 10} ${fy} M${fx} ${fy - 10} L${fx} ${fy + 10}" stroke="#d33" stroke-width="2"/>`;
    cells += `<text x="${ox + 12}" y="${oy + 26}" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="18" font-weight="700" fill="rgba(40,20,30,.75)">PLACEHOLDER ${anim.state} ${i + 1}/${frameCount}</text>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${cells}<desc>${id}</desc></svg>`;
  return svgToDataUri(svg);
}
