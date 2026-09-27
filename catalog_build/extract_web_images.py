#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Build web images for the SPS 2026 catalog into public/catalog/2026/.

Source: SPS-Qoliplar-Katalogi-2026.pdf — every one of the 130 product pages
carries env / mold / quyma artwork with a deterministic code mapping (see
make_catalog_edit.py main(): cover/konsepsiya/texnik/index = pp 1-4, then per
section: divider + one page per product in products.json order).

Role classification per page (template draw + layout, make_catalog_edit.py):
the full-bleed image is ENV; of the two product shots the left one is the
MOLD (QOLIP) and the right one the QUYMA (NATIJA).

Presentation: mold/quyma are padded to a square canvas and env keeps its
aspect; all are Lanczos-upscaled to a consistent web size with a mild unsharp
mask so cards and galleries look uniform and crisp.

Output: {CODE}-env.jpg, {CODE}-mold.jpg, {CODE}-quyma.jpg (progressive JPEG).
"""
import glob
import io
import json
import os
import sys

import pymupdf
from PIL import Image, ImageFilter, ImageOps

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "SPS-Qoliplar-Katalogi-2026.pdf")
PRODUCTS = json.load(open(os.path.join(ROOT, "catalog_build", "products.json"), encoding="utf-8"))
OUT = os.path.join(ROOT, "public", "catalog", "2026")

PRESET = {  # role -> (target size, jpeg quality)
    "env": (1200, 78),
    "mold": (900, 82),
    "quyma": (900, 82),
}


def page_map():
    pm = {}
    n = 5
    for s in ("S1", "S2", "S3"):
        n += 1
        for p in [pp for pp in PRODUCTS if pp["section"] == s]:
            pm[n] = p
            n += 1
    return pm


def classify_page(page):
    """Return {role: xref} for env/mold/quyma using display geometry."""
    rects = {}
    for x in sorted(page.get_images(full=True), key=lambda t: t[0]):
        xref, w, h = x[0], x[2], x[3]
        if w < 200 or h < 200:
            continue  # logo / decoration
        try:
            rs = page.get_image_rects(xref)
        except Exception:
            rs = []
        if not rs:
            continue
        r = max(rs, key=lambda rr: rr.width * rr.height)
        rects[xref] = r
    if not rects:
        return {}
    by_area = sorted(rects.items(), key=lambda kv: kv[1].width * kv[1].height, reverse=True)
    out = {"env": by_area[0][0]}
    rest = sorted(by_area[1:], key=lambda kv: kv[1].x0)
    if len(rest) >= 2:
        out["mold"] = rest[0][0]
        out["quyma"] = rest[-1][0]
    elif len(rest) == 1:
        out["quyma"] = rest[0][0]
    return out


def polish(im, role):
    target, q = PRESET[role]
    if im.mode != "RGB":
        im = im.convert("RGB")
    if role in ("mold", "quyma"):
        # square canvas, contain-fit on white — uniform cards & galleries
        im = ImageOps.contain(im, (target, target), Image.LANCZOS)
        canvas = Image.new("RGB", (target, target), (255, 255, 255))
        canvas.paste(im, ((target - im.width) // 2, (target - im.height) // 2))
        im = canvas
    else:
        w, h = im.size
        if w != target:
            im = im.resize((target, max(1, round(h * target / w))), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=3)), q


def main():
    os.makedirs(OUT, exist_ok=True)
    for old in glob.glob(os.path.join(OUT, "*.jpg")):
        os.remove(old)

    doc = pymupdf.open(PDF)
    pm = page_map()
    print(f"pages: {doc.page_count}, product pages: {len(pm)}")

    made = 0
    problems = []
    for pno, prod in sorted(pm.items()):
        page = doc[pno - 1]
        roles = classify_page(page)
        # fallback: a product page without a separate mold shot reuses the quyma
        if "mold" not in roles and "quyma" in roles:
            roles["mold"] = roles["quyma"]
            problems.append((prod["code"], "mold->quyma fallback"))
        for role in ("env", "mold", "quyma"):
            xref = roles.get(role)
            if xref is None:
                problems.append((prod["code"], role))
                continue
            pix = pymupdf.Pixmap(doc, xref)
            if pix.colorspace and pix.colorspace.n > 3:
                pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
            im = Image.open(io.BytesIO(pix.tobytes("png")))
            im, q = polish(im, role)
            im.save(os.path.join(OUT, f"{prod['code']}-{role}.jpg"),
                    "JPEG", quality=q, optimize=True, progressive=True)
            made += 1

    total = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
    print(f"images written: {made}, files: {len(os.listdir(OUT))}, size: {total/1024/1024:.1f} MB")
    if problems:
        print("problems:", problems)


if __name__ == "__main__":
    sys.exit(main())
