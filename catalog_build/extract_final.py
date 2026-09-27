#!/usr/bin/env python3
"""Definitive catalog extraction: roles solved via each page's 877x1241 collage
([mold|quyma / env] panels) matched against the page's other image xrefs."""
import glob, io, json, os, sys
import pymupdf
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
Image.MAX_IMAGE_PIXELS = None

ROOT = '/home/user/spsplast'
PDF = os.path.join(ROOT, 'SPS-Qoliplar-Katalogi-2026.pdf')
OUT = os.path.join(ROOT, 'public/catalog/2026')
os.makedirs(OUT, exist_ok=True)

def dhash(im, hs=16):
    g = im.convert('L').resize((hs+1, hs), Image.LANCZOS)
    px = list(g.tobytes()); bits = 0
    for row in range(hs):
        for col in range(hs):
            left = px[row*(hs+1)+col]; right = px[row*(hs+1)+col+1]
            bits = (bits << 1) | (1 if left > right else 0)
    return bits

def ham(a, b): return bin(a ^ b).count('1')

def polish(im):
    if im.mode == 'RGBA':
        bg = Image.new('RGB', im.size, 'white'); bg.paste(im, mask=im.split()[-1]); im = bg
    return im.convert('RGB')

def norm_square(im, size=900, pad=26, bg=(255,255,255), q=82):
    im = polish(im)
    canvas = Image.new('RGB', (size, size), bg)
    inner = size - 2*pad
    im2 = im.copy(); im2.thumbnail((inner, inner), Image.LANCZOS)
    canvas.paste(im2, ((size-im2.width)//2, (size-im2.height)//2))
    canvas = ImageEnhance.Sharpness(canvas).enhance(1.12)
    canvas = ImageEnhance.Contrast(canvas).enhance(1.03)
    return canvas

def norm_env(im, max_w=1200, q=78):
    im = polish(im)
    if im.width > max_w:
        im = im.resize((max_w, round(im.height*max_w/im.width)), Image.LANCZOS)
    im = ImageEnhance.Sharpness(im).enhance(1.1)
    im = ImageEnhance.Contrast(im).enhance(1.02)
    return im

def save(im, name, q=82):
    path = os.path.join(OUT, name)
    im.save(path, 'JPEG', quality=q, optimize=True, progressive=True)

def xref_image(doc, xref):
    pix = pymupdf.Pixmap(doc, xref)
    if pix.colorspace and pix.colorspace.n > 3:
        pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
    return Image.open(io.BytesIO(pix.tobytes('png')))

doc = pymupdf.open(PDF)
pm, n = {}, 5
for s in ('S1','S2','S3'):
    n += 1
    for p in json.load(open(os.path.join(ROOT,'catalog_build/products.json'), encoding='utf-8')):
        if p['section'] == s:
            pm[n] = p; n += 1

report = []
for pno, prod in sorted(pm.items()):
    code, section = prod['code'], prod['section']
    page = doc[pno-1]
    cands = []
    collage = None
    for x in sorted(page.get_images(full=True), key=lambda t: t[0]):
        xref, w, h = x[0], x[2], x[3]
        if w < 200 or h < 200: continue
        if not page.get_image_rects(xref): continue
        im = xref_image(doc, xref)
        if (w, h) == (877, 1241):
            collage = im; continue
        g = im.convert('L').resize((32, 32))
        mean = sum(g.tobytes()) / 1024
        cands.append({'xref': xref, 'w': w, 'h': h, 'im': im, 'mean': mean,
                      'area': w*h, 'land': w >= 1.25*h, 'sq': 0.78 <= w/h <= 1.28})
    row = {'code': code, 'page': pno, 'section': section}
    if collage is None:
        report.append({**row, 'err': 'no collage'}); continue

    env_fallback = collage.crop((0, 620, 877, 1241))
    squares = [c for c in cands if c['sq']]
    lands = sorted([c for c in cands if c['land']], key=lambda c: -c['area'])
    used = set()

    if section == 'S3':
        if len(lands) >= 2:
            qu, mo = lands[0], lands[-1]
        elif len(lands) == 1:
            qu, mo = lands[0], None
        else:
            qu, mo = None, None
        if qu:
            save(norm_square(qu['im']), f'{code}-quyma.jpg'); used.add(qu['xref']); row['quyma'] = qu['xref']
        else:
            save(norm_square(collage.crop((438, 0, 877, 620))), f'{code}-quyma.jpg'); row['quyma'] = 'collage'
        if mo:
            save(norm_square(mo['im']), f'{code}-mold.jpg'); used.add(mo['xref']); row['mold'] = mo['xref']
        else:
            save(norm_square(collage.crop((0, 0, 438, 620))), f'{code}-mold.jpg'); row['mold'] = 'collage'
        save(norm_env(env_fallback), f'{code}-env.jpg'); row['env'] = 'collage'
    else:
        # G-series: squares -> mold (darkest) + quyma (lightest) + alts; largest landscape -> env
        if squares:
            s_sorted = sorted(squares, key=lambda c: c['mean'])
            mo = s_sorted[0]
            qu = s_sorted[-1] if len(s_sorted) > 1 else None
            save(norm_square(mo['im']), f'{code}-mold.jpg'); used.add(mo['xref']); row['mold'] = mo['xref']
            if qu:
                save(norm_square(qu['im']), f'{code}-quyma.jpg'); used.add(qu['xref']); row['quyma'] = qu['xref']
            else:
                save(norm_square(collage.crop((438, 0, 877, 620))), f'{code}-quyma.jpg'); row['quyma'] = 'collage'
            alts = [c for c in s_sorted[1:-1]] if qu else []
            for i, a in enumerate(alts, 1):
                save(norm_square(a['im']), f'{code}-alt{i}.jpg'); used.add(a['xref'])
        else:
            save(norm_square(collage.crop((0, 0, 438, 620))), f'{code}-mold.jpg'); row['mold'] = 'collage'
            save(norm_square(collage.crop((438, 0, 877, 620))), f'{code}-quyma.jpg'); row['quyma'] = 'collage'
        if lands:
            save(norm_env(lands[0]['im']), f'{code}-env.jpg'); used.add(lands[0]['xref']); row['env'] = lands[0]['xref']
        else:
            save(norm_env(env_fallback), f'{code}-env.jpg'); row['env'] = 'collage'

    extras = [c for c in cands if c['xref'] not in used]
    row['extras'] = [(c['xref'], c['w'], c['h']) for c in extras]
    report.append(row)
    print(f"{code} p{pno} {section}: mold={row.get('mold')} quyma={row.get('quyma')} env={row.get('env')} extras={len(extras)}")

json.dump(report, open('/home/user/.scratch/final_extract_report.json', 'w'), indent=1)
files = glob.glob(os.path.join(OUT, '*.jpg'))
total = sum(os.path.getsize(f) for f in files)
print(f"\nDONE: {len(files)} files, {total/1024/1024:.1f} MB")
