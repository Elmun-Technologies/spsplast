#!/usr/bin/env python3
"""SPS Plast — qolip va plitka rasmlaridan fonni olib tashlash (`npm run images:bg`).

Faqat MAHALLIY ishlaydi (rembg + onnxruntime, rasmlar hech qayerga yuborilmaydi):
    pip install --user rembg onnxruntime
Model fayllari rembg tomonidan GitHub release'dan ~/.u2net ga yuklanadi.

Natija — `media-src/clean/<dst-nomi>.png` niqoblari (repoda saqlanadi) va
`media-src/clean/manifest.json` (har bir rasm: usul, holat, izoh). Keyin
`public/catalog/2027/*-mold-*.webp`, `*-tile-*.webp` shu niqoblar bilan qayta
yoziladi (`cutout_2027.compose_cutout`). `npm run models:images` ham shu
niqoblarni o'qiydi, shuning uchun rembg faqat niqobni yangilashda kerak.

Sahna rasmlari (`*-scene*.webp`) va `public/images/site` ga tegilmaydi.

    python3 scripts/extract/remove_bg_2027.py              # hammasi
    python3 scripts/extract/remove_bg_2027.py --only rio    # nomida "rio" borlar
    python3 scripts/extract/remove_bg_2027.py --compose     # niqoblardan faqat WebP
    python3 scripts/extract/remove_bg_2027.py --compose --sheets  # + kontakt varaqlari
"""
import argparse
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cutout_2027 import (CLEAN_DIR, ROOT, compose_cutout, is_cutout_job,  # noqa: E402
                         mask_path, resolve_src)

JOBS = os.path.join(ROOT, "data/image-jobs-2027.json")
MANIFEST = os.path.join(CLEAN_DIR, "manifest.json")
DEFAULT_MODEL = "isnet-general-use"

# Vizual tekshiruvdan keyin tanlangan alohida sozlamalar (dst nomi -> usul).
#   {"model": "u2net"}                      — boshqa rembg modeli
#   {"flood": 12}                           — ImageMagick: burchaklardan floodfill, fuzz %
#   {"keep": "sabab"}                       — fonni olib tashlab bo'lmadi, asl rasm qoladi
#   {"dark": 110}                           — to'q qolip och/sariq fonda: max(R,G,B) < chegara
#   {"white": 215}                          — plitka: oq fon chegarasi (standart 232)
OVERRIDES: dict = {
    # ikki bo'lak orasidagi tirqish 220..232 kulrang — pastroq chegara kerak
    "trotuar-bumerang-tile-a": {"white": 212},
}


def _auto_override(name: str, src: str) -> dict:
    """2026 studiya qoliplari: to'q ko'k qolip sariq taxta + kulrang tokcha oldida.
    isnet sariq taxtani ham "obyekt" deb oladi, shuning uchun yorqinlik bo'yicha
    ajratiladi (qolip qorong'i, fon och/sariq)."""
    if src.startswith("media-src/studio-2026/") and "-mold-" in name:
        return {"dark": 110}
    return {}


def _dark_mask(rgb, thr: int):
    """To'q ko'k qolip: max(R,G,B) < thr VA ko'k >= qizil (sariq taxta ustidagi
    jigarrang soya R > B bo'lgani uchun chiqib ketadi). Keyin yopish (relyefdagi
    och chiziqlar), ochish (JPEG shovqini, ignalar) va Gauss silliqlash — kichik
    manba 2x kattalashtirilganda chet tishli ko'rinmasin."""
    import numpy as np
    from PIL import Image
    from scipy import ndimage
    r, b = rgb[..., 0].astype(np.int16), rgb[..., 2].astype(np.int16)
    solid = (rgb.max(axis=2) < thr) & (b - r > -8)
    solid = ndimage.binary_closing(solid, iterations=2)
    solid = ndimage.binary_opening(solid, iterations=3)
    solid = ndimage.binary_fill_holes(solid)
    soft = ndimage.gaussian_filter(solid.astype(np.float32), 1.5)
    return Image.fromarray((np.clip((soft - 0.5) * 4 + 0.5, 0, 1) * 255).astype(np.uint8))


def _load_jobs():
    seen, out = set(), []
    for j in json.load(open(JOBS)):
        if is_cutout_job(j["dst"]) and j["dst"] not in seen:
            seen.add(j["dst"])
            out.append(j)
    return out


_SESSIONS: dict = {}


def _rembg_mask(img, model: str):
    from rembg import new_session, remove
    if model not in _SESSIONS:
        _SESSIONS[model] = new_session(model)
    return remove(img, session=_SESSIONS[model], only_mask=True, post_process_mask=False)


def _flood_mask(src_abs: str, fuzz: int, out_png: str):
    """Oddiy bir xil fon: 4 burchakdan floodfill, qolgan hamma narsa obyekt."""
    w, h = map(int, subprocess.run(["identify", "-format", "%w %h", src_abs],
                                   capture_output=True, text=True).stdout.split()[:2])
    cmd = ["convert", src_abs, "-auto-orient", "-alpha", "set", "-fuzz", f"{fuzz}%",
           "-fill", "none"]
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        cmd += ["-draw", f"color {x},{y} floodfill"]
    cmd += ["-alpha", "extract", out_png]
    subprocess.run(cmd, check=True)


def _clean(mask, fill_holes: bool = True):
    """Mayda dog'larni olib tashlash va obyekt ichidagi teshiklarni to'ldirish.

    Qolip relyefidagi ichki chuqurliklar fon EMAS: to'liq o'ralgan har qanday
    "teshik" obyektga qaytariladi. Bir rasmda 2 bo'lak bo'lishi mumkin (juft
    qoliplar), shuning uchun eng kattasining >=4% bo'lgan bo'laklar saqlanadi.
    """
    import numpy as np
    from scipy import ndimage
    a = np.asarray(mask, dtype=np.uint8).copy()
    solid = a >= 128
    lab, n = ndimage.label(solid)
    if n == 0:
        return a, 0.0
    sizes = ndimage.sum(solid, lab, range(1, n + 1))
    keep_ids = [i + 1 for i, s in enumerate(sizes) if s >= 0.04 * sizes.max()]
    keep = np.isin(lab, keep_ids)
    # zaif alfa (yumshoq chet) faqat saqlangan bo'laklar yonida qoladi
    near = ndimage.binary_dilation(keep, iterations=3)
    a[~near] = 0
    if not fill_holes:
        return a, 0.0
    filled = ndimage.binary_fill_holes(keep)
    holes = filled & ~keep
    a[holes] = 255
    return a, float(holes.sum()) / max(1, filled.sum())


def _stats(a):
    import numpy as np
    h, w = a.shape
    solid = a >= 128
    cover = float(solid.mean())
    border = np.concatenate([solid[0], solid[-1], solid[:, 0], solid[:, -1]])
    edge = float(border.mean())
    return cover, edge


def make_mask(job, model_override=None):
    from PIL import Image, ImageOps
    import numpy as np
    dst = job["dst"]
    name = os.path.splitext(os.path.basename(dst))[0]
    src = resolve_src(job["src"])
    src_abs = os.path.join(ROOT, src)
    entry = {"src": src}
    if not os.path.exists(src_abs):
        entry.update(status="original", method="-", note="manba fayl yo'q")
        return entry
    ov = OVERRIDES.get(name) or _auto_override(name, src)
    out_png = mask_path(dst)
    os.makedirs(CLEAN_DIR, exist_ok=True)
    if "keep" in ov:
        if os.path.exists(out_png):
            os.remove(out_png)
        entry.update(status="original", method="-", note=ov["keep"])
        return entry
    if "flood" in ov:
        _flood_mask(src_abs, ov["flood"], out_png)
        m = Image.open(out_png).convert("L")
        method, status = f"floodfill fuzz {ov['flood']}%", "fallback"
    elif "dark" in ov:
        rgb = np.asarray(ImageOps.exif_transpose(Image.open(src_abs)).convert("RGB"))
        m = _dark_mask(rgb, ov["dark"])
        method, status = f"rang kaliti max(RGB)<{ov['dark']}, B>=R", "fallback"
    else:
        model = model_override or ov.get("model", DEFAULT_MODEL)
        img = ImageOps.exif_transpose(Image.open(src_abs)).convert("RGB")
        m = _rembg_mask(img, model).convert("L")
        # yumshoq chetni toraytirish (20%..80% -> 0..255): kichik manba
        # kattalashtirilganda keng och "halo" qolmasin
        m = Image.fromarray(np.clip((np.asarray(m, np.float32) - 51) * (255 / 153), 0, 255)
                            .astype(np.uint8))
        if "-tile-" in name:
            # kulrang beton plitka oq studiya fonida: juft plitkalar orasidagi oq
            # tirqishni rembg obyekt deb oladi -> deyarli oq piksellar fon
            rgb = np.asarray(img)
            white = rgb.min(axis=2) > ov.get("white", 232)
            m = Image.fromarray(np.where(white, 0, np.asarray(m)).astype(np.uint8))
        method = f"rembg {model}"
        status = "ok" if model == DEFAULT_MODEL else "fallback"
    a, hole_ratio = _clean(m, fill_holes="-tile-" not in name)
    cover, edge = _stats(a)
    Image.fromarray(a).save(out_png, optimize=True)
    notes = []
    if cover < 0.02:
        notes.append(f"obyekt juda kichik ({cover:.1%})")
    if edge > 0.15:
        notes.append(f"niqob chetga tegadi ({edge:.0%}) — kesilgan bo'lishi mumkin")
    if hole_ratio > 0.02:
        notes.append(f"ichki teshiklar to'ldirildi ({hole_ratio:.1%})")
    entry.update(status=status, method=method, cover=round(cover, 4),
                 edge=round(edge, 3), note="; ".join(notes) or ov.get("note", ""))
    return entry


def contact_sheets(manifest: dict):
    """docs/audits/bg-removal/{molds,tiles}_{before,ck,wh}.jpg — manba / natija
    shaxmat fonda / natija oq fonda (vizual tekshiruv uchun, gitignored)."""
    out = os.path.join(ROOT, "docs/audits/bg-removal")
    os.makedirs(out, exist_ok=True)
    for kind in ("mold", "tile"):
        names = [n for n in manifest if f"-{kind}-" in n]
        after = [os.path.join(ROOT, "public/catalog/2027", n + ".webp") for n in names]
        before = [os.path.join(ROOT, manifest[n]["src"]) for n in names]
        base = ["montage", "-label", "%t", "-pointsize", "10"]
        tail = ["-tile", "8x", "-geometry", "150x150+2+2", "-quality", "80"]
        sets = (("before", [], before),
                ("ck", ["-texture", "pattern:checkerboard"], after),
                ("wh", ["-background", "white"], after))
        for tag, extra, files in sets:
            subprocess.run(base + extra + files + tail +
                           [os.path.join(out, f"{kind}s_{tag}.jpg")], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="regex: dst nomi yoki manba yo'li bo'yicha filtr")
    ap.add_argument("--model", help="hammasi uchun boshqa rembg modeli (sinov)")
    ap.add_argument("--compose", action="store_true", help="niqob yasamay, faqat WebP")
    ap.add_argument("--sheets", action="store_true", help="kontakt varaqlarini ham yasash")
    args = ap.parse_args()

    manifest = json.load(open(MANIFEST)) if os.path.exists(MANIFEST) else {}
    jobs = [j for j in _load_jobs()
            if not args.only or re.search(args.only, j["dst"] + " " + resolve_src(j["src"]))]
    for j in jobs:
        name = os.path.splitext(os.path.basename(j["dst"]))[0]
        if not args.compose:
            manifest[name] = make_mask(j, args.model)
        e = manifest.get(name, {})
        if e.get("status") in ("ok", "fallback") and os.path.exists(mask_path(j["dst"])):
            if not compose_cutout(resolve_src(j["src"]), mask_path(j["dst"]),
                                  os.path.join(ROOT, j["dst"])):
                e.update(status="original", note="compose xato")
        print(f"{e.get('status', '?'):9} {name:40} {e.get('method', '')}  {e.get('note', '')}")
    manifest = dict(sorted(manifest.items()))
    json.dump(manifest, open(MANIFEST, "w"), ensure_ascii=False, indent=1)
    c = {}
    for e in manifest.values():
        c[e["status"]] = c.get(e["status"], 0) + 1
    print("jami:", len(manifest), c)
    if args.sheets:
        contact_sheets(manifest)
        print("kontakt varaqlari: docs/audits/bg-removal/")


if __name__ == "__main__":
    main()
