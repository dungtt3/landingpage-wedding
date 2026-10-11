"""
Split the floral paper-cut medallion into animatable layers.

    python scripts/split-medallion.py art-source/medallion.jpg public/assets/storybook/shared [--debug out.png]

Source: a square RGB render on a plain light-grey background (it may shade
gently towards the corners). Output, all on an OUT x OUT canvas with alpha:

  medallion-ring.webp      the white lattice ring, rebuilt from one clean
                           half-motif mirrored all the way round, so it can
                           spin in place without showing a seam or the flowers
                           that used to sit on top of it;
  medallion-deco.webp      everything else that stays still (ivory centre, leaves,
                           phoenixes, red ornaments), with the ring band and the
                           sprites cut out;
  medallion-<sprite>.webp  each flower / leaf sprig on its own, cropped to its box.

The background becomes transparent; the soft paper shadows on it become
semi-transparent black so they still read on the red backdrop. A faint
watermark on the background (e.g. the Gemini sparkle) is lighter than every
shadow and is dropped with it.

All coordinates below are measured on art-source/medallion.jpg (2048x2048).
Another render needs new measurements: centre, ring radii, sprite circles.

Prints the sprite rects (normalised to the canvas) for storybook.config.ts.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = 1600                  # output canvas size (px)
CX, CY = 1040.0, 1030.0     # medallion centre (source px)
R0, R1 = 632.0, 805.0       # ring band: inner white rim .. outer lattice edge
IVORY = (251, 245, 238)     # paper colour inside the ring
MOTIF = 90.0                # source half-motif starts at the bottom crest (image angle, y down)
HALF = 22.5                 # ...and spans this many degrees; 360 / (2 * HALF) copies

# name, centre x, centre y, radius (source px), pivot (fraction of the sprite box) for the sway
SPRITES = [
    ('flower-tl', 524, 500, 116, (0.5, 0.5)),
    ('flower-tr', 1564, 524, 140, (0.5, 0.5)),
    ('flower-left', 540, 886, 180, (0.5, 0.5)),
    ('flower-bl', 740, 1370, 172, (0.5, 0.5)),
    ('flower-peony', 1380, 1150, 280, (0.5, 0.5)),
    ('flower-white', 1212, 1546, 84, (0.5, 0.5)),
    ('flower-small-l', 464, 1504, 100, (0.5, 0.5)),
    ('flower-small-r', 1630, 1500, 100, (0.5, 0.5)),
    ('sprig-tl', 400, 300, 130, (0.85, 0.85)),
    ('sprig-tr', 1656, 290, 130, (0.15, 0.85)),
    ('sprig-bl', 410, 1720, 130, (0.85, 0.15)),
    ('sprig-br', 1650, 1710, 130, (0.15, 0.15)),
]


def flood(candidate: np.ndarray, seeds) -> np.ndarray:
    """Pixels of `candidate` connected to any seed."""
    m = Image.fromarray(np.where(candidate, 255, 0).astype(np.uint8)).copy()  # writable copy
    for s in seeds:
        if m.getpixel(s) == 255:
            ImageDraw.floodfill(m, s, 128)
    return np.asarray(m) == 128


def circle_mask(h, w, cx, cy, r, feather):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.hypot(xx + 0.5 - cx, yy + 0.5 - cy)
    return np.clip((r - d) / feather + 0.5, 0, 1)


def bilinear(img: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    x = np.clip(x - 0.5, 0, w - 1.001)
    y = np.clip(y - 0.5, 0, h - 1.001)
    x0 = x.astype(int); y0 = y.astype(int)
    fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def save(rgba: np.ndarray, path: str, box=None):
    out = Image.fromarray(np.clip(rgba, 0, 255).round().astype(np.uint8), 'RGBA')
    if box:
        out = out.crop(box)
    out.save(path, 'WEBP', quality=90, method=6)
    return out.size


def main(src, out_dir, debug=None):
    source = Image.open(src).convert('RGB')
    S = OUT / source.width
    big = source.resize((OUT, OUT), Image.LANCZOS)
    rgb = np.asarray(big).astype(float)
    H, W = rgb.shape[:2]
    cx, cy = CX * S, CY * S

    # --- background -> transparent, neutral shadows -> black with alpha
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    # plain bg, plus the slightly pink-tinted contact shadows right under the paper
    cand = ((sat <= 12) | ((sat <= 24) & (lum < 200))) & (lum >= 110)
    bg = flood(cand, [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1), (int(cx), int(cy))])
    bg = np.asarray(Image.fromarray(bg.astype(np.uint8) * 255).filter(ImageFilter.MaxFilter(3))) > 0
    # Local background level (it shades towards the corners): normalised blur of the bg pixels.
    k = 16
    lo = (W // k, H // k)
    bgw = Image.fromarray((bg * 255).astype(np.uint8)).resize(lo, Image.BOX).filter(ImageFilter.GaussianBlur(6))
    bgl = Image.fromarray((lum * bg).astype(np.uint8)).resize(lo, Image.BOX).filter(ImageFilter.GaussianBlur(6))
    level = np.asarray(bgl, float) / np.maximum(np.asarray(bgw, float), 1) * 255
    level = np.where(np.asarray(bgw) > 2, level, 230)
    BG = np.asarray(Image.fromarray(level.astype(np.float32), 'F').resize((W, H), Image.BILINEAR))
    shadow = np.clip((BG - 8 - lum) / (BG - 8) * 1.6, 0, 1)   # faint watermark and the bg itself -> 0
    alpha = np.where(bg, shadow, 1.0)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))) / 255.0
    colour = np.where(bg[..., None], 0.0, rgb)
    rgba = np.dstack([colour, alpha * 255])

    yy, xx = np.mgrid[0:H, 0:W]
    dx = xx + 0.5 - cx; dy = yy + 0.5 - cy
    rad = np.hypot(dx, dy)
    ang = np.degrees(np.arctan2(dy, dx)) % 360

    # Inside the ring the grey paper becomes an opaque ivory disc (shadows kept
    # as shading), which also wipes the watermark there.
    inside = (rad < (R0 + 3) * S)[..., None]
    shade = 1 - np.clip((BG - 14 - lum) / BG, 0, 1)   # near the bg level (incl. a watermark) = flat
    ivory = np.array(IVORY, float) * shade[..., None]
    rgba[..., :3] = np.where(inside & bg[..., None], ivory, rgba[..., :3])
    rgba[..., 3] = np.where(inside[..., 0], 255, rgba[..., 3])

    # --- ring: mirror the half-motif round the full circle
    t = (ang - MOTIF) % (2 * HALF)
    d = np.where(t <= HALF, t, 2 * HALF - t)
    src_ang = np.radians(MOTIF + d)
    sx = cx + rad * np.cos(src_ang)
    sy = cy + rad * np.sin(src_ang)
    band = np.clip((rad - R0 * S) / 2 + 0.5, 0, 1) * np.clip((R1 * S - rad) / 2 + 0.5, 0, 1)
    ring = bilinear(rgba, sx, sy)
    ring[..., 3] *= band
    r_box = (int(cx - R1 * S - 4), int(cy - R1 * S - 4), int(cx + R1 * S + 4), int(cy + R1 * S + 4))
    save(ring, f'{out_dir}/medallion-ring.webp', r_box)

    # --- sprites (full original pixels inside a soft circle) and the holes they leave
    deco = rgba.copy()
    deco[..., 3] *= 1 - band
    rects = []
    for name, sx_, sy_, r, pivot in SPRITES:
        scx, scy, sr = sx_ * S, sy_ * S, r * S
        m = circle_mask(H, W, scx, scy, sr, 3)
        sprite = rgba.copy()
        sprite[..., 3] *= m
        box = (int(scx - sr - 2), int(scy - sr - 2), int(scx + sr + 2), int(scy + sr + 2))
        save(sprite, f'{out_dir}/medallion-{name}.webp', box)
        deco[..., 3] *= 1 - circle_mask(H, W, scx, scy, sr - 12 * S, 3)
        rects.append((name, box, pivot))
    save(deco, f'{out_dir}/medallion-deco.webp')

    print(f'canvas {W}x{H}; ring box {r_box}')
    print('ring:', {k: round(v / W, 4) for k, v in zip(('x', 'y', 'x2', 'y2'), r_box)})
    for name, (x0, y0, x1, y1), pivot in rects:
        print(f"  {{ id: '{name}', rect: {{ x: {x0 / W:.4f}, y: {y0 / H:.4f}, width: {(x1 - x0) / W:.4f}, height: {(y1 - y0) / H:.4f} }}, pivot: [{pivot[0]}, {pivot[1]}] }},")

    if debug:
        # composite on red to eyeball: deco + ring rotated 20deg + sprites, plus the sprite circles
        base = Image.new('RGBA', (W, H), (125, 18, 20, 255))
        base.alpha_composite(Image.open(f'{out_dir}/medallion-deco.webp').convert('RGBA'))
        ringimg = Image.open(f'{out_dir}/medallion-ring.webp').convert('RGBA').rotate(20, Image.BICUBIC)
        base.alpha_composite(ringimg, (r_box[0], r_box[1]))
        for name, box, _ in rects:
            base.alpha_composite(Image.open(f'{out_dir}/medallion-{name}.webp').convert('RGBA'), (box[0], box[1]))
        dr = ImageDraw.Draw(base)
        if '--circles' in sys.argv:
            for name, sx_, sy_, r, _ in SPRITES:
                dr.ellipse([(sx_ - r) * S, (sy_ - r) * S, (sx_ + r) * S, (sy_ + r) * S], outline=(0, 255, 0, 255), width=2)
        base.convert('RGB').save(debug)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--circles']
    dbg = None
    if '--debug' in args:
        i = args.index('--debug'); dbg = args[i + 1]; del args[i:i + 2]
    main(args[0], args[1], dbg)
