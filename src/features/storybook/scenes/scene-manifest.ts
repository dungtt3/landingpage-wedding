/**
 * Asset manifest — the single list of every file the storybook expects.
 *
 * - `src` is where the production file must be placed (under `public/`).
 * - When that file is absent the runtime renders the generated, clearly
 *   labelled `placeholder` instead (and reports `placeholder` status).
 * - Replacing art = drop the file at `src`. No engine/component change.
 *
 * This module must stay data-only (type imports only) so that
 * `npm run assets:check` can import it directly with Node.
 */
import type { AssetEntry, AssetKind, AssetRequirement, PlaceholderSpec } from '../engine/sceneTypes';

const ROOT = '/assets/storybook';

function entry(
  id: string,
  path: string,
  kind: AssetKind,
  requirement: AssetRequirement,
  size: [number, number],
  description: string,
  placeholder: PlaceholderSpec | null,
  critical = false,
): AssetEntry {
  return {
    id,
    src: `${ROOT}/${path}`,
    kind,
    requirement,
    critical,
    width: size[0],
    height: size[1],
    description,
    placeholder,
  };
}

const SKY_DAWN = ['#f9e3d3', '#f5c9b8', '#d9b9d8', '#a9b7d6'];
const SKY_DAY = ['#fbeedd', '#f3d6c2', '#bcd3e0', '#95b6cf'];
const SKY_DUSK = ['#fbe2cf', '#f2b8a6', '#c99ab8', '#7f86b3'];
const HILL_GREEN = ['#a9c49a', '#86a77b', '#5f7f5c'];
const TREE = ['#6f8f62', '#4f6d4a', '#7a5a43'];
const BLOSSOM = ['#f2b5bf', '#e98fa0', '#fff3e6', '#7aa074'];
const GOLD = ['#e7b75f', '#c8893b', '#fff1c9'];

/** Sprites cut by scripts/split-medallion.py: [name, square size px]. */
const MEDALLION_SPRITES: [string, number][] = [
  ['flower-tl', 186], ['flower-tr', 223], ['flower-left', 285],
  ['flower-bl', 273], ['flower-peony', 441], ['flower-white', 135], ['flower-small-l', 160], ['flower-small-r', 160],
  ['sprig-tl', 208], ['sprig-tr', 207], ['sprig-bl', 207], ['sprig-br', 207],
];

export const assetManifest: AssetEntry[] = [
  /* ---------------------------------------------------------- shared intro */
  entry('envelope-backdrop', 'shared/envelope-backdrop.jpg', 'image', 'optional', [1792, 2400],
    'Tileable pattern behind the closed card (tiled and faded by envelope.backdrop).', null, true),
  entry('gate-left', 'shared/gate-left.webp', 'image', 'required', [504, 1482],
    'Gatefold card, left panel front (alpha). Hinge on its left edge.',
    { shape: 'envelope-body', palette: ['#a3121c', '#7d0d14', '#e2aa5c'] }, true),
  entry('gate-right', 'shared/gate-right.webp', 'image', 'required', [508, 1480],
    'Gatefold card, right panel front (alpha). Hinge on its right edge.',
    { shape: 'envelope-body', palette: ['#b8161f', '#8a1017', '#e2aa5c'] }, true),
  entry('gate-seal', 'shared/gate-seal.webp', 'image', 'required', [451, 1095],
    'Medallion seal with tassel (alpha); lifts off before the panels open.',
    { shape: 'envelope-seal', palette: ['#c8202b', '#8a1017', '#f0c987'] }, true),
  entry('invitation-paper', 'shared/invitation-paper.webp', 'image', 'optional', [1143, 1602],
    'Invitation sheet inside the opened card: red peony + koi frame, blank ivory panel for the HTML text.', null, true),
  entry('medallion-deco', 'shared/medallion-deco.webp', 'image', 'optional', [1600, 1600],
    'Floral medallion behind the closed card: still layer (alpha).', null, true),
  entry('medallion-ring', 'shared/medallion-ring.webp', 'image', 'optional', [1266, 1266],
    'Medallion lattice ring (alpha), rotates slowly in place.', null, true),
  ...MEDALLION_SPRITES.map(([name, size]) =>
    entry(`medallion-${name}`, `shared/medallion-${name}.webp`, 'image', 'optional', [size, size],
      'Medallion flower / sprig (alpha) that sways on its own.', null, true)),
  entry('transition-foliage', 'shared/transition-foliage.webp', 'image', 'optional', [2600, 1600],
    'Large foreground foliage used for the Scene 1 → 2 wipe.',
    { shape: 'curtain', palette: ['#5f7f5c', '#86a77b', '#f2b5bf'] }),
  entry('particles-petals', 'shared/particles-petals.webp', 'image', 'optional', [1600, 1000],
    'Transparent falling petals (atmosphere).',
    { shape: 'petals', palette: BLOSSOM, seed: 7 }),
  entry('paper-texture', 'shared/paper-texture.webp', 'image', 'optional', [1024, 1024],
    'Optional tileable paper grain overlay (not used yet).', null),

  /* --------------------------------------------------------------- scene 1 */
  entry('scene-01-desktop-background', 'scenes/scene-01/desktop/scene-01-desktop-background.webp', 'image', 'required',
    [2200, 1240], 'Scene 1 sky + distant mountains, desktop (with camera bleed).',
    { shape: 'sky', palette: SKY_DAWN }, true),
  entry('scene-01-mobile-background', 'scenes/scene-01/mobile/scene-01-mobile-background.webp', 'image', 'required',
    [1240, 2200], 'Scene 1 sky + distant mountains, mobile portrait composition.',
    { shape: 'sky', palette: SKY_DAWN }, true),
  entry('scene-01-sun', 'scenes/scene-01/scene-01-sun.webp', 'image', 'optional', [560, 560],
    'Soft sun/moon glow back ornament.', { shape: 'sun', palette: ['#fff1c9', '#f8cf8f'] }, true),
  entry('scene-01-cloud-left', 'scenes/scene-01/scene-01-cloud-left.webp', 'image', 'required', [720, 300],
    'Back ornament cloud (left).', { shape: 'cloud', palette: ['#fffaf3', '#ead7cf'] }, true),
  entry('scene-01-cloud-right', 'scenes/scene-01/scene-01-cloud-right.webp', 'image', 'required', [640, 280],
    'Back ornament cloud (right).', { shape: 'cloud', palette: ['#fffaf3', '#e4d2d8'], flip: true }, true),
  entry('scene-01-desktop-hills', 'scenes/scene-01/desktop/scene-01-desktop-hills.webp', 'image', 'required',
    [2400, 620], 'Scene 1 midground hills, desktop.', { shape: 'hills', palette: HILL_GREEN, seed: 3 }, true),
  entry('scene-01-mobile-hills', 'scenes/scene-01/mobile/scene-01-mobile-hills.webp', 'image', 'required',
    [1400, 900], 'Scene 1 midground hills, mobile.', { shape: 'hills', palette: HILL_GREEN, seed: 4 }, true),
  entry('scene-01-tree-left', 'scenes/scene-01/scene-01-tree-left.webp', 'image', 'required', [640, 920],
    'Midground blossom tree (left).', { shape: 'tree', palette: [...BLOSSOM.slice(0, 2), TREE[2]], seed: 11 }, true),
  entry('scene-01-tree-right', 'scenes/scene-01/scene-01-tree-right.webp', 'image', 'required', [640, 920],
    'Midground blossom tree (right).',
    { shape: 'tree', palette: [...BLOSSOM.slice(0, 2), TREE[2]], seed: 12, flip: true }, true),
  entry('scene-01-lantern-left', 'scenes/scene-01/scene-01-lantern-left.webp', 'image', 'optional', [180, 360],
    'Hanging lantern prop that drops in (left).', { shape: 'lantern', palette: GOLD }, true),
  entry('scene-01-lantern-right', 'scenes/scene-01/scene-01-lantern-right.webp', 'image', 'optional', [180, 360],
    'Hanging lantern prop that drops in (right).', { shape: 'lantern', palette: GOLD, flip: true }, true),
  entry('scene-01-foreground-left', 'scenes/scene-01/scene-01-foreground-left.webp', 'image', 'required', [960, 760],
    'Foreground flowers/leaves framing the left edge.', { shape: 'flowers', palette: BLOSSOM, seed: 21 }, true),
  entry('scene-01-foreground-right', 'scenes/scene-01/scene-01-foreground-right.webp', 'image', 'required', [960, 760],
    'Foreground flowers/leaves framing the right edge.',
    { shape: 'flowers', palette: BLOSSOM, seed: 22, flip: true }, true),
  entry('scene-01-final-reference', 'scenes/scene-01/desktop/scene-01-final-reference.jpg', 'reference', 'required',
    [1920, 1080], 'Composition reference of the assembled Scene 1 (desktop).', null),
  entry('scene-01-mobile-final-reference', 'scenes/scene-01/mobile/scene-01-mobile-final-reference.jpg', 'reference',
    'required', [1080, 1920], 'Composition reference of the assembled Scene 1 (mobile).', null),

  /* --------------------------------------------------------------- scene 2 */
  entry('scene-02-desktop-background', 'scenes/scene-02/desktop/scene-02-desktop-background.webp', 'image', 'required',
    [3000, 1300], 'Scene 2 wide sky/mountains with extension for the camera journey.',
    { shape: 'mountains', palette: SKY_DAY, seed: 5 }),
  entry('scene-02-mobile-background', 'scenes/scene-02/mobile/scene-02-mobile-background.webp', 'image', 'required',
    [2000, 2300], 'Scene 2 sky/mountains, mobile framing.', { shape: 'mountains', palette: SKY_DAY, seed: 6 }),
  entry('scene-02-desktop-midground', 'scenes/scene-02/desktop/scene-02-desktop-midground.webp', 'image', 'required',
    [4200, 640], 'Scene 2 rolling hills + path (midground), desktop.', { shape: 'path', palette: HILL_GREEN, seed: 8 }),
  entry('scene-02-mobile-midground', 'scenes/scene-02/mobile/scene-02-mobile-midground.webp', 'image', 'required',
    [2800, 1000], 'Scene 2 rolling hills + path (midground), mobile.', { shape: 'path', palette: HILL_GREEN, seed: 9 }),
  entry('scene-02-house', 'scenes/scene-02/scene-02-house.webp', 'image', 'optional', [620, 560],
    'Small house / destination landmark.', { shape: 'house', palette: ['#f3e3cf', '#c46a5a', '#7b5a46'] }),
  entry('scene-02-tree', 'scenes/scene-02/scene-02-tree.webp', 'image', 'required', [540, 820],
    'Roadside tree (reused several times).', { shape: 'tree', palette: TREE, seed: 15 }),
  entry('scene-02-fence', 'scenes/scene-02/scene-02-fence.webp', 'image', 'optional', [1400, 220],
    'Wooden fence segment.', { shape: 'fence', palette: ['#b48b65', '#8a6448'] }),
  entry('scene-02-foreground-grass', 'scenes/scene-02/scene-02-foreground-grass.webp', 'image', 'required', [5000, 380],
    'Foreground grass strip (fast parallax).', { shape: 'grass', palette: ['#5f7f5c', '#7d9d6f', '#f2b5bf'], seed: 31 }),
  entry('scene-02-foreground-branch', 'scenes/scene-02/scene-02-foreground-branch.webp', 'image', 'required',
    [1200, 640], 'Foreground branch occluder (also used to push into Scene 3).',
    { shape: 'branch', palette: ['#4f6d4a', '#6f8f62', '#f2b5bf'], seed: 33 }),
  entry('scene-02-final-reference', 'scenes/scene-02/desktop/scene-02-final-reference.jpg', 'reference', 'required',
    [1920, 1080], 'Composition reference with camera start/end frames (desktop).', null),
  entry('scene-02-mobile-final-reference', 'scenes/scene-02/mobile/scene-02-mobile-final-reference.jpg', 'reference',
    'required', [1080, 1920], 'Composition reference with camera start/end frames (mobile).', null),

  /* ------------------------------------------------------------ characters */
  entry('couple-idle', 'characters/couple-idle.png', 'spritesheet', 'required', [1440, 480],
    'Couple idle loop — 4 frames, 4×1 grid, 360×480 per frame.', { shape: 'sprite-couple', palette: ['idle'] }),
  entry('couple-walk', 'characters/couple-walk.png', 'spritesheet', 'required', [1440, 960],
    'Couple walk cycle — 8 frames, 4×2 grid, 360×480 per frame, facing right.',
    { shape: 'sprite-couple', palette: ['walk'] }),
  entry('couple-pose', 'characters/couple-pose.png', 'spritesheet', 'required', [1200, 1040],
    'Couple finale pose / wave — 6 frames, 3×2 grid, 400×520 per frame.',
    { shape: 'sprite-couple', palette: ['pose'] }),
  entry('couple-walk-left', 'characters/couple-walk-left.png', 'spritesheet', 'optional', [1440, 960],
    'Optional authored left-facing walk (preferred over mirroring asymmetric art).', null),
  entry('couple-walk-json', 'characters/couple-walk.json', 'reference', 'optional', [0, 0],
    'Exporter metadata for the walk sheet (values are copied into characters.config.ts).', null),

  /* --------------------------------------------------------------- scene 3 */
  entry('scene-03-desktop-background', 'scenes/scene-03/desktop/scene-03-desktop-background.webp', 'image', 'required',
    [2300, 1300], 'Finale sky/backdrop, desktop.', { shape: 'sky', palette: SKY_DUSK }),
  entry('scene-03-mobile-background', 'scenes/scene-03/mobile/scene-03-mobile-background.webp', 'image', 'required',
    [1300, 2300], 'Finale sky/backdrop, mobile.', { shape: 'sky', palette: SKY_DUSK }),
  entry('scene-03-glow', 'scenes/scene-03/scene-03-glow.webp', 'image', 'optional', [1000, 1000],
    'Warm glow behind the arch.', { shape: 'glow', palette: ['#fff1c9', '#f6c7a0'] }),
  entry('scene-03-arch', 'scenes/scene-03/scene-03-arch.webp', 'image', 'required', [1100, 1060],
    'Primary decorative structure — floral wedding arch.', { shape: 'arch', palette: ['#fff8ee', '#f2b5bf', '#7aa074', '#c8893b'], seed: 41 }),
  entry('scene-03-desktop-garden', 'scenes/scene-03/desktop/scene-03-desktop-garden.webp', 'image', 'required',
    [2500, 560], 'Finale midground flower bank, desktop.', { shape: 'hills', palette: ['#b7cfa5', '#8fb07f', '#6f8f62'], seed: 43 }),
  entry('scene-03-mobile-garden', 'scenes/scene-03/mobile/scene-03-mobile-garden.webp', 'image', 'required',
    [1500, 760], 'Finale midground flower bank, mobile.', { shape: 'hills', palette: ['#b7cfa5', '#8fb07f', '#6f8f62'], seed: 44 }),
  entry('scene-03-flowers-left', 'scenes/scene-03/scene-03-flowers-left.webp', 'image', 'required', [900, 760],
    'Finale foreground flowers (left).', { shape: 'flowers', palette: BLOSSOM, seed: 51 }),
  entry('scene-03-flowers-right', 'scenes/scene-03/scene-03-flowers-right.webp', 'image', 'required', [900, 760],
    'Finale foreground flowers (right).', { shape: 'flowers', palette: BLOSSOM, seed: 52, flip: true }),
  entry('scene-03-final-reference', 'scenes/scene-03/desktop/scene-03-final-reference.jpg', 'reference', 'required',
    [1920, 1080], 'Finale composition reference incl. text-safe area (desktop).', null),
  entry('scene-03-mobile-final-reference', 'scenes/scene-03/mobile/scene-03-mobile-final-reference.jpg', 'reference',
    'required', [1080, 1920], 'Finale composition reference incl. text-safe area (mobile).', null),

  /* ----------------------------------------------------------------- audio */
  entry('audio-envelope-open', 'audio/envelope-open.mp3', 'audio', 'optional', [0, 0],
    'Paper/envelope opening sound (plays only after the user gesture).', null),
  entry('audio-footsteps', 'audio/footsteps.mp3', 'audio', 'optional', [0, 0], 'Soft footsteps for Scene 2.', null),
  entry('audio-music', 'audio/background-music.mp3', 'audio', 'optional', [0, 0], 'Background music loop.', null),
];

export const assetsById: Record<string, AssetEntry> = Object.fromEntries(assetManifest.map((a) => [a.id, a]));
