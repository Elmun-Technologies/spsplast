#!/usr/bin/env python3
"""Bosma katalog PDF'ining veb nusxasi (2026-11-24): rasmlarni kichraytirib JPEG qiladi, matn/vektor tegilmaydi.

  python3 scripts/pdf/compress_catalog.py <kirish.pdf> <chiqish.pdf> [--max 1500] [--q 72]

Bosma katalog (150–200 MB, 300 dpi) saytda varaqlash uchun og'ir. A4 yotiq sahifa ekranda ~1400 px bo'ladi,
shuning uchun rasmning uzun tomoni `--max` px gacha tushiriladi. Shaffoflik niqobi (SMask) ham shu o'lchamga.
Natija `qpdf --linearize` bilan (varaqlagich sahifalarni Range so'rovlari bilan bo'laklab oladi).
"""
import argparse
import io
import subprocess
import zlib

import pikepdf
from PIL import Image
from pikepdf import Name, PdfImage


def shrink(pdf, obj, maxpx, q):
    w, h = int(obj.Width), int(obj.Height)
    if max(w, h) <= maxpx:
        return False
    try:
        im = PdfImage(obj).as_pil_image()
    except Exception:  # noqa: BLE001 — g'alati kodlangan rasm: tegmaymiz
        return False
    k = maxpx / max(w, h)
    size = (max(1, round(w * k)), max(1, round(h * k)))
    smask = obj.get('/SMask')
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        alpha = im.getchannel('A')
        im = im.convert('RGB')
    else:
        alpha = None
        im = im.convert('L' if im.mode in ('L', '1') else 'RGB')
    im = im.resize(size, Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=q, optimize=True, progressive=False)
    obj.write(buf.getvalue(), filter=Name.DCTDecode)
    obj.Width, obj.Height = size
    obj.ColorSpace = Name.DeviceGray if im.mode == 'L' else Name.DeviceRGB
    obj.BitsPerComponent = 8
    for key in ('/DecodeParms', '/Decode', '/Interpolate'):
        if key in obj:
            del obj[key]
    if smask is not None:
        try:
            a = PdfImage(smask).as_pil_image().convert('L')
        except Exception:  # noqa: BLE001
            a = alpha
        if a is not None:
            a = a.resize(size, Image.LANCZOS)
            smask.write(zlib.compress(a.tobytes(), 9), filter=Name.FlateDecode)
            smask.Width, smask.Height = size
            smask.ColorSpace = Name.DeviceGray
            smask.BitsPerComponent = 8
            for key in ('/DecodeParms', '/Decode'):
                if key in smask:
                    del smask[key]
    elif alpha is not None:
        a = alpha.resize(size, Image.LANCZOS)
        sm = pikepdf.Stream(pdf, zlib.compress(a.tobytes(), 9))
        sm.Type, sm.Subtype = Name.XObject, Name.Image
        sm.Width, sm.Height = size
        sm.ColorSpace, sm.BitsPerComponent, sm.Filter = Name.DeviceGray, 8, Name.FlateDecode
        obj.SMask = sm
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--max', type=int, default=1500)
    ap.add_argument('--q', type=int, default=72)
    a = ap.parse_args()
    pdf = pikepdf.open(a.src)
    seen, n = set(), 0
    for obj in pdf.objects:
        if not isinstance(obj, pikepdf.Stream) or obj.get('/Subtype') != Name.Image:
            continue
        if obj.objgen in seen:
            continue
        seen.add(obj.objgen)
        # SMask'ning o'zi ham Image — uni ota rasm bilan birga kichraytiramiz
        if obj.get('/ImageMask') or obj.get('/BitsPerComponent') == 1:
            continue
        n += shrink(pdf, obj, a.max, a.q)
    tmp = a.dst + '.tmp.pdf'
    pdf.remove_unreferenced_resources()
    pdf.save(tmp, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    subprocess.run(['qpdf', '--linearize', tmp, a.dst], check=True)
    subprocess.run(['rm', '-f', tmp], check=True)
    print(f'{n} ta rasm kichraytirildi → {a.dst}')


if __name__ == '__main__':
    main()
