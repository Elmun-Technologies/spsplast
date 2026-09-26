#!/usr/bin/env python3
"""Extract environment renders, bands and composite assets from the two source PDFs."""
import io, os
import fitz
from PIL import Image

IMG = "images"
G_PDF = "../SPS_Qoliplar_Katalogi_2026_full_compressed.pdf"
A10_PDF = "../SPS-birlashgan-ishchi-katalog-yoyilmalar_compressed.pdf"

Q_ENV = 74
made = {"envp": 0, "envfull": 0, "band": 0}

def save(im, path, q):
    if im.mode != "RGB":
        im = im.convert("RGB")
    im.save(path, "JPEG", quality=q, optimize=True)

# ---- 1) G-series: portrait half-page envs from left halves of editorial PDF ----
g = fitz.open(G_PDF)
for idx in range(4, 107):  # pages 5..107 => G001..G103
    pg = g[idx]
    code = f"G{idx-3:03d}"
    best = None
    for x in pg.get_images(full=True):
        x0 = x[7]
        w, h = x[2], x[3]
        r = pg.get_image_bbox(x)
        if w > 700 and r.x0 < 5:
            if best is None or w * h > best[0] * best[1]:
                best = (w, h, x[0])
    if best is None:
        print("miss", code)
        continue
    pix = fitz.Pixmap(g, best[2])
    if pix.colorspace and pix.colorspace.n > 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    im = Image.open(io.BytesIO(pix.tobytes("jpeg")))
    save(im, f"{IMG}/{code}_envp.jpg", Q_ENV)
    made["envp"] += 1

# ---- 2) A10 pages 108..134: full composite envs + focal-left portrait crops ----
import json
s3_codes = [p["code"] for p in json.load(open("products.json", encoding="utf-8")) if p["section"] == "S3"]
assert len(s3_codes) == 27, len(s3_codes)
a = fitz.open(A10_PDF)
n = 0
for idx in range(108, 135):
    pg = a[idx]
    code = s3_codes[n]
    n += 1
    best = None
    for x in pg.get_images(full=True):
        w, h = x[2], x[3]
        if w > 1400 and (best is None or w * h > best[0] * best[1]):
            best = (w, h, x[0])
    if best is None:
        print("miss", code)
        continue
    pix = fitz.Pixmap(a, best[2])
    if pix.colorspace and pix.colorspace.n > 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    im = Image.open(io.BytesIO(pix.tobytes("jpeg")))
    if im.width > 1400:
        im = im.resize((1400, int(im.height * 1400 / im.width)))
    save(im, f"{IMG}/{code}_envfull.jpg", Q_ENV)
    made["envfull"] += 1
    # focal-left portrait crop (877:1241)
    tw = int(im.height * 877 / 1241)
    if tw > im.width:
        tw = im.width
    crop = im.crop((0, 0, tw, im.height))
    crop = crop.resize((877, 1241))
    save(crop, f"{IMG}/{code}_envp.jpg", Q_ENV)
    made["envp"] += 1

# ---- 3) landscape bands for G products (from envp portrait) ----
for code_i in range(1, 104):
    code = f"G{code_i:03d}"
    src = f"{IMG}/{code}_envp.jpg"
    if not os.path.exists(src):
        continue
    im = Image.open(src)
    w, h = im.size
    bh = int(w * 0.62)            # band height
    cy = int(h * 0.52)            # slightly below centre focus
    y0 = max(0, min(h - bh, cy - bh // 2))
    band = im.crop((0, y0, w, y0 + bh))
    if band.width > 720:
        band = band.resize((720, int(band.height * 720 / band.width)))
    save(band, f"{IMG}/{code}_band.jpg", 72)
    made["band"] += 1

# ---- 4) landscape divider art ----
def land_crop(src, dst, min_h=860):
    im = Image.open(src)
    w, h = im.size
    th = max(min_h, int(w * h / w / 1.414))
    th = min(th, h)
    y0 = (h - th) // 2
    im = im.crop((0, y0, w, y0 + th))
    save(im, dst, 76)

land_crop(f"{IMG}/G013_envp.jpg", f"{IMG}/div1L.jpg")
land_crop(f"{IMG}/G030_envp.jpg", f"{IMG}/div2L.jpg")
# div3 from biggest A10 env composite (A10-033 landscape-ish)
im = Image.open(f"{IMG}/A10-036_envfull.jpg")
w, h = im.size
th = int(w / 1.414)
th = min(th, h)
y0 = (h - th) // 2
save(im.crop((0, y0, w, y0 + th)), f"{IMG}/div3L.jpg", 76)

# ---- 5) cover right art + konsepsiya env ----
im = Image.open(f"{IMG}/G005_envp.jpg")
w, h = im.size
save(im, f"{IMG}/coverR.jpg", 78)
im2 = Image.open(f"{IMG}/G001_envp.jpg")
w2, h2 = im2.size
b2 = int(w2 * 0.62)
c2 = int(h2 * 0.5)
y02 = max(0, min(h2 - b2, c2 - b2 // 2))
save(im2.crop((0, y02, w2, y02 + b2)), f"{IMG}/kons_env.jpg", 74)

print("made:", made)
