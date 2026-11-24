#!/usr/bin/env python3
"""SPS Plast — oq fonli suratdan kesilgan qoliplar chetidagi oq hoshiyani (soya qoldig'ini) tozalash.

Muammo: bosma katalog suratlari oq fonda, yumshoq soya bilan. Floodfill niqobi faqat oqqa yaqin
pikselni olib tashlaydi — soya (och kulrang) kesma ichida qoladi. Och fonda bilinmasdi, to'q
"studiya" fonida qolip atrofida oq hoshiya bo'lib ko'rinadi.

Yechim (faqat TO'Q obyektlar uchun): tashqi chetdan ichkariga qarab, soyaga o'xshash piksellar
(rangsiz, och, silliq va ichkariga tomon faqat to'qlashib boradigan) topiladi va "oq ustidagi soya"
deb qayta talqin qilinadi: rang — qora, shaffoflik = 1 − yorqinlik. Obyektning o'zi (keskin chet,
faktura, ichkariga tomon ochroq gardish) to'siq bo'ladi — unga tegilmaydi.

Niqob RGB PNG bo'lib qoladi: R = alfa, G = rang ko'paytiruvchisi (0 — qora soya, 255 — asl rang).
`cutout_2027.compose_cutout` RGB niqobni shu tartibda o'qiydi; kulrang niqoblar avvalgidek ishlaydi.

    python3 scripts/extract/defringe_2027.py            # manifestdagi barcha floodfill niqoblari
    python3 scripts/extract/defringe_2027.py --only rim # nomida "rim" borlar
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage as ndi

sys.path.insert(0, os.path.dirname(__file__))
from cutout_2027 import CLEAN_DIR, ROOT, resolve_src  # noqa: E402

SAT_MAX = 0.10      # soya rangsiz
L_MIN = 0.42        # bundan to'q piksel — obyekt
DOG_MAX = 0.012     # keskin chet / faktura to'sig'i (|G(0.8) − G(3)|)
MONO_EPS = 0.02     # ichkariga tomon yorqinlik oshmasligi kerak
REACH = 0.035       # eng uzun tomonning ulushi — soya kengligi chegarasi
GAP_L = 0.60        # tirqish yorqinligi
GAP_REACH = 0.008   # tirqish kengligi chegarasi (eng uzun tomonning ulushi)
DARK_MEDIAN = 0.45  # obyekt ichining mediana yorqinligi shundan past bo'lsa — to'q obyekt


def defringe(src_abs: str, mask_png: str) -> str:
    """Niqobni joyida qayta yozadi. Qaytaradi: 'ok', 'och' (och obyekt — tegilmadi), 'yoq' (soya topilmadi)."""
    img = np.asarray(ImageOps.exif_transpose(Image.open(src_abs)).convert("RGB"), dtype=np.float32) / 255.0
    m = Image.open(mask_png)
    a0 = np.asarray(m.convert("RGB"))[:, :, 0] if m.mode not in ("L", "1", "P", "LA") else np.asarray(m.convert("L"))
    if a0.shape != img.shape[:2]:
        return "yoq"
    obj = a0 > 0
    solid = a0 > 127
    lum = img @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    sat = img.max(axis=2) - img.min(axis=2)
    size = max(obj.shape)
    inner = ndi.binary_erosion(solid, iterations=max(2, int(0.04 * size)))
    if inner.sum() < 500:
        inner = solid
    if float(np.median(lum[inner])) >= DARK_MEDIAN:
        return "och"
    ls = ndi.gaussian_filter(lum, 1.0)
    dog = np.abs(ndi.gaussian_filter(lum, 0.8) - ndi.gaussian_filter(lum, 3.0))
    loose = obj & (sat < SAT_MAX + 0.02) & (ls >= L_MIN)        # chetga tegib turgan 2 piksel (silliqlash aralashmasi)
    cand = loose & (sat < SAT_MAX) & (dog < DOG_MAX)
    eight = np.ones((3, 3), bool)
    reach = loose & ndi.binary_dilation(~obj, structure=eight)
    inf = np.float32(9.0)
    run = np.where(reach, ls, inf).astype(np.float32)            # yo'l bo'ylab eng past yorqinlik
    for it in range(int(REACH * size)):
        nb = ndi.minimum_filter(run, size=3)
        new = (loose if it < 2 else cand) & ~reach & (nb < inf) & (ls <= nb + MONO_EPS)
        if not new.any():
            break
        run[new] = np.minimum(nb[new], ls[new])
        reach |= new
    if reach.sum() < 50:
        return "yoq"
    # Obyekt bilan uning soyasi orasida qolgan ingichka oq tirqish (fon): soyaga tutash juda och rangsiz piksellar.
    gap = obj & ~reach & (sat < SAT_MAX + 0.02) & (lum > GAP_L)
    grow = ndi.binary_dilation(reach, structure=eight, iterations=max(2, int(GAP_REACH * size)), mask=gap | reach)
    reach = grow & obj
    alpha = np.where(reach, np.clip((1.0 - ls) * 255.0, 0, 255), np.where(obj, np.maximum(a0, 1), 0)).astype(np.uint8)
    mult = np.where(obj & ~reach, 255, 0).astype(np.uint8)
    Image.fromarray(np.dstack([alpha, mult, np.zeros_like(alpha)]), "RGB").save(mask_png, optimize=True)
    return "ok"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    mp = os.path.join(CLEAN_DIR, "manifest.json")
    manifest = json.load(open(mp, encoding="utf-8"))
    stat = {}
    for name, row in sorted(manifest.items()):
        if args.only and args.only not in name:
            continue
        if not str(row.get("method", "")).startswith("floodfill"):
            continue
        src = os.path.join(ROOT, resolve_src(row["src"]))
        mask = os.path.join(CLEAN_DIR, name + ".png")
        if not (os.path.exists(src) and os.path.exists(mask)):
            continue
        r = defringe(src, mask)
        stat[r] = stat.get(r, 0) + 1
        if r == "ok":
            row["defringe"] = "soya→alfa"
    json.dump(dict(sorted(manifest.items())), open(mp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("defringe:", stat)


if __name__ == "__main__":
    main()
