"""Split the gatefold card photo into left panel, right panel and medallion+tassel.

    python scripts/split-gatefold-card.py art-source/gatefold-card.jpg public/assets/storybook/shared

Writes gate-left.webp, gate-right.webp, gate-seal.webp (alpha) and prints the
normalised part rects to copy into `storybook.config.ts -> envelope.parts`.
The panels under the medallion are re-filled with the card's own paper texture.
Vietnamese lettering is laid over TEXT_BOX on the right panel in HTML
(`envelope.text`); ERASE_TEXT_BOX first erases printed text there. The 囍
medallion is kept. All coordinates below are measured on the 1792x2400 source
photo; a different photo needs new measurements (outline polygons, seam,
medallion circle, tassel outline, clean paper blocks).
Requires Pillow. Also writes preview_*.png into the current directory.
"""
import json, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

src = Image.open(sys.argv[1]).convert('RGB')
W, H = src.size
px = src.load()

SEAM_L, SEAM_R = 892, 908          # left panel ends / right panel starts (gap between)
CX, CY, R = 895, 1086, 222         # medallion

# ---- card silhouettes: measured outline of each panel (supersampled -> anti-aliased)
LEFT_POLY = [(394, 534), (500, 527), (700, 519), (892, 512), (892, 1989), (700, 1987), (394, 1985)]
RIGHT_POLY = [(908, 512), (1000, 514), (1200, 522), (1410, 529), (1410, 1985), (1200, 1985), (908, 1987)]
def silhouette(poly, k=4):
    m = Image.new('L', (W * k, H * k), 0)
    ImageDraw.Draw(m).polygon([(x * k, y * k) for x, y in poly], fill=255)
    return m.resize((W, H), Image.LANCZOS)

left_sil = silhouette(LEFT_POLY)
right_sil = silhouette(RIGHT_POLY)

# ---- medallion + cord, bead, knot and tassel (traced outline, slightly grown)
seal = Image.new('L', (W, H), 0)
ImageDraw.Draw(seal).ellipse((CX - R, CY - R, CX + R, CY + R), fill=255)
TASSEL_POLY = [(882, CY + R - 30), (910, CY + R - 30), (912, 1445), (920, 1452), (920, 1495), (926, 1560),
               (946, 1650), (980, 1800), (1012, 1950), (788, 1950), (812, 1800), (848, 1650), (866, 1560),
               (864, 1495), (864, 1452), (878, 1445)]
tassel = Image.new('L', (W, H), 0)
ImageDraw.Draw(tassel).polygon(TASSEL_POLY, fill=255)
seal = ImageChops.lighter(seal, tassel.filter(ImageFilter.MaxFilter(5)))
seal_soft = seal.filter(ImageFilter.GaussianBlur(1.2))

# ---- inpaint panels under the seal by tiling a clean block of the same panel
def inpaint(sil, block, extra=None):
    """Fill the hole with mirrored tiles of a clean block, re-lit to match the
    low-frequency light of the surrounding panel (normalised blur)."""
    bx0, by0, bx1, by1 = block
    bw, bh = bx1 - bx0, by1 - by0
    seal_hole = seal.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.MaxFilter(31))  # include the seal's soft drop shadow
    regions = [seal_hole] + ([extra] if extra is not None else [])
    hole = seal_hole if extra is None else ImageChops.lighter(seal_hole, extra)
    hx0, hy0, hx1, hy1 = hole.getbbox()
    keep = ImageChops.multiply(sil, ImageChops.invert(hole))           # panel pixels we trust
    # low-frequency light: blur(img*keep) / blur(keep), done at 1/8 scale for speed
    k = 8
    small = (W // k, H // k)
    img_s = src.resize(small, Image.BOX)
    keep_s = keep.resize(small, Image.BOX)
    masked = Image.composite(img_s, Image.new('RGB', small), keep_s)
    # several radii summed (one smooth normalised convolution): fine detail near
    # the edge, wide reach in the middle, and no contour where one radius takes over
    levels = [(masked.filter(ImageFilter.GaussianBlur(r)).load(), keep_s.filter(ImageFilter.GaussianBlur(r)).load()) for r in (5, 12, 24, 48)]
    light = Image.new('RGB', small); lp = light.load()
    for y in range(small[1]):
        for x in range(small[0]):
            d = sum(dp[x, y] for _, dp in levels) / 255
            num = [sum(np_[x, y][i] for np_, _ in levels) for i in range(3)]
            lp[x, y] = tuple(round(c / d) for c in num) if d > 0.001 else (120, 15, 20)
    light = light.resize((W, H), Image.BILINEAR); lpx = light.load()
    blk = [px[x, y] for y in range(by0, by1, 2) for x in range(bx0, bx1, 2)]
    bmean = [sum(p[i] for p in blk) / len(blk) for i in range(3)]
    def mirror(v, n):
        v %= 2 * n
        return v if v < n else 2 * n - 1 - v
    out = src.copy(); op = out.load()
    hp = hole.load(); sp = sil.load()
    for y in range(hy0, hy1):
        for x in range(hx0, hx1):
            if hp[x, y] and sp[x, y]:
                p = px[bx0 + mirror(x - bx0, bw), by0 + mirror(y - by0, bh)]
                op[x, y] = tuple(max(0, min(255, round(c - m + l))) for c, m, l in zip(p, bmean, lpx[x, y]))
    # Final per-region exposure match: mean of the fill = mean of the paper ring
    # around it, ignoring paper near the panel edges (the seam casts a dark strip).
    inner = sil.filter(ImageFilter.MinFilter(41)).filter(ImageFilter.MinFilter(41)).load()
    for region in regions:
        rg = region.load()
        ring = ImageChops.subtract(region.filter(ImageFilter.MaxFilter(41)), hole).load()
        bx = region.filter(ImageFilter.MaxFilter(41)).getbbox()
        ring_px, fill_xy = [], []
        for y in range(bx[1], bx[3]):
            for x in range(bx[0], bx[2]):
                if sp[x, y] < 250:
                    continue
                if rg[x, y]:
                    fill_xy.append((x, y))
                elif ring[x, y] and inner[x, y] >= 250:
                    ring_px.append(px[x, y])
        if not ring_px or not fill_xy:
            continue
        rm = [sum(p[i] for p in ring_px) / len(ring_px) for i in range(3)]
        fm = [sum(op[x, y][i] for x, y in fill_xy) / len(fill_xy) for i in range(3)]
        for x, y in fill_xy:
            op[x, y] = tuple(max(0, min(255, round(op[x, y][i] + rm[i] - fm[i]))) for i in range(3))
    feather = hole.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(14))
    return Image.composite(out, src, feather)

left_img = inpaint(left_sil, (450, 1280, 660, 1560))
# Where the Vietnamese lettering is laid over the right panel in HTML. Set
# ERASE_TEXT_BOX when the photo has printed text there that must go first.
TEXT_BOX = (1060, 1340, 1350, 1874)
ERASE_TEXT_BOX = False
text_hole = Image.new('L', (W, H), 0)
ImageDraw.Draw(text_hole).rounded_rectangle(TEXT_BOX, radius=24, fill=255)
right_img = inpaint(right_sil, (1140, 1340, 1380, 1570), extra=text_hole if ERASE_TEXT_BOX else None)

def cut(img, mask, pad=2):
    box = mask.getbbox()
    rgba = img.copy(); rgba.putalpha(mask)
    return rgba.crop(box), box

L, lbox = cut(left_img, left_sil)
Rp, rbox = cut(right_img, right_sil)
S, sbox = cut(src, ImageChops.multiply(seal_soft, ImageChops.lighter(left_sil, right_sil).filter(ImageFilter.MaxFilter(41))))

# card box = union of panels
cx0 = min(lbox[0], rbox[0]); cy0 = min(lbox[1], rbox[1]); cx1 = max(lbox[2], rbox[2]); cy1 = max(lbox[3], rbox[3])
cw, ch = cx1 - cx0, cy1 - cy0
rect = lambda b: {k: round(v, 4) for k, v in dict(x=(b[0]-cx0)/cw, y=(b[1]-cy0)/ch, width=(b[2]-b[0])/cw, height=(b[3]-b[1])/ch).items()}
local = lambda b, box: {k: round(v, 4) for k, v in dict(x=(b[0]-box[0])/(box[2]-box[0]), y=(b[1]-box[1])/(box[3]-box[1]),
                         width=(b[2]-b[0])/(box[2]-box[0]), height=(b[3]-b[1])/(box[3]-box[1])).items()}
meta = {'card': [cw, ch], 'aspect': round(cw / ch, 4), 'left': rect(lbox), 'right': rect(rbox), 'seal': rect(sbox),
        'panelLabel (inside right panel)': local(TEXT_BOX, rbox),
        'sizes': {'left': L.size, 'right': Rp.size, 'seal': S.size}}
out = sys.argv[2]
L.save(f'{out}/gate-left.webp', quality=90, method=6)
Rp.save(f'{out}/gate-right.webp', quality=90, method=6)
S.save(f'{out}/gate-seal.webp', quality=92, method=6)
# previews
prev = Image.new('RGB', (cw, ch), (240, 240, 240))
prev.paste(L, (lbox[0]-cx0, lbox[1]-cy0), L); prev.paste(Rp, (rbox[0]-cx0, rbox[1]-cy0), Rp)
prev.save('preview_no_seal.png')
prev.paste(S, (sbox[0]-cx0, sbox[1]-cy0), S); prev.save('preview_full.png')
sv = Image.new('RGB', S.size, (40, 120, 60)); sv.paste(S, (0, 0), S); sv.save('preview_seal.png')
print(json.dumps(meta))
