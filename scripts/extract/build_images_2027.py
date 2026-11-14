#!/usr/bin/env python3
"""SPS Plast — `public/catalog/2027/*.webp` generator (bosqich 0).

`data/image-jobs-2027.json` dagi har bir manba rasmini WebP ga o'tkazadi:
  sahna 1400w / 720w, qolip va plitka 800w (HANDOFF.md 6-bo'lim).
Konvertatsiya qilinmagan (manba fayl yo'q / xato) ishlardan keyin
`models-2027.json` dagi mos rasm maydoni `null` ga qaytariladi — sayt
hech qachon mavjud bo'lmagan faylga havola bermaydi.

Qolip/plitka (`-mold-`, `-tile-`) rasmlari uchun `media-src/clean/<nom>.png`
niqobi bo'lsa, fonsiz shaffof kvadrat WebP yoziladi (`cutout_2027.py`;
niqoblar `npm run images:bg` bilan yangilanadi, bu yerda rembg kerak emas).
Eski `public/catalog/2026/...` manbalari `media-src/studio-2026/` dan olinadi.
Manba topilmasa-yu, tayyor WebP repoda bo'lsa (masalan sahna rasmlari — 2026
`-env` manbalari repoda yo'q), fayl saqlanadi va havola `null` qilinmaydi.
"""
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from cutout_2027 import compose_cutout, is_cutout_job, mask_path, resolve_src, write_catalog  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
JOBS = os.path.join(ROOT, "data/image-jobs-2027.json")
MODELS = os.path.join(ROOT, "data/models-2027.json")


def convert(src: str, dst: str, width: int) -> bool:
    src = os.path.join(ROOT, src)
    dst = os.path.join(ROOT, dst)
    if not os.path.exists(src):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    cmd = ["convert", src, "-auto-orient", "-resize", f"{width}x{width}>",
           "-strip", "-quality", "80", "-define", "webp:method=6", dst]
    r = subprocess.run(cmd, capture_output=True)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 500


def main():
    jobs = json.load(open(JOBS))
    manifest_path = os.path.join(ROOT, "media-src/clean/manifest.json")
    manifest = json.load(open(manifest_path)) if os.path.exists(manifest_path) else {}
    ok = fail = cut = kept = stale = 0
    failed_dst = set()
    for j in jobs:
        src = resolve_src(j["src"])
        mask = mask_path(j["dst"])
        name = os.path.splitext(os.path.basename(j["dst"]))[0]
        # Niqob boshqa manba uchun yasalgan bo'lsa (masalan render o'rniga tirik surat keldi) —
        # ishlatilmaydi: fonli rasm yoziladi, `npm run images:bg` yangi niqob yasaydi.
        fresh = manifest.get(name, {}).get("src") == src
        if is_cutout_job(j["dst"]) and os.path.exists(mask) and not fresh:
            stale += 1
            print("NIQOB ESKIRGAN (npm run images:bg)", j["dst"], file=sys.stderr)
        if is_cutout_job(j["dst"]) and os.path.exists(mask) and fresh and \
                compose_cutout(src, mask, os.path.join(ROOT, j["dst"]), j["w"]):
            ok += 1
            cut += 1
        elif convert(src, j["dst"], j["w"]):
            ok += 1
        elif not os.path.exists(os.path.join(ROOT, src)) and \
                os.path.exists(os.path.join(ROOT, j["dst"])):
            kept += 1
        else:
            fail += 1
            failed_dst.add("/" + j["dst"].replace("public/", ""))
            print("FAIL", j["src"], "->", j["dst"], file=sys.stderr)
    if failed_dst:
        bare = lambda u: (u or "").split("?", 1)[0]  # noqa: E731 — URL'da ?v= xesh bo'lishi mumkin
        data = json.load(open(MODELS))
        for m in data["models"]:
            im = m["images"]
            if bare(im["scene"]) in failed_dst:
                im["scene"] = None
            if bare(im["sceneSm"]) in failed_dst:
                im["sceneSm"] = None
            for k, v in list(im["molds"].items()):
                if bare(v) in failed_dst:
                    del im["molds"][k]
            for k, v in list(im["tiles"].items()):
                if bare(v) in failed_dst:
                    del im["tiles"][k]
        # JSON bilan birga TS modul ham (ilgari faqat JSON yozilardi — sayt eski TS'ni o'qirdi).
        write_catalog(data)
    # Yetim fayllar: hech bir job'da yo'q va kodda (src/) nomi tilga olinmagan generatsiya rasmlari
    # o'chiriladi (niqobi bilan). Masalan tirik surat render o'rnini egallasa eski `*-3d.webp`,
    # yoki surat boshqa modelga ko'chirilsa eski modelning `-mold-a.webp` i (2026-11-14: PR #44 dagi
    # noto'g'ri bog'langan 28 surat). Qo'lda qo'yilgan fayl kodda tilga olingan bo'lsa saqlanadi.
    want = {os.path.basename(j["dst"]) for j in jobs}
    src_text = ""
    for _r, _d, _f in os.walk(os.path.join(ROOT, "src")):
        for fn in _f:
            if fn.endswith((".ts", ".tsx")) and fn != "models2027.ts":
                src_text += open(os.path.join(_r, fn), encoding="utf-8").read()
    pruned = 0
    cat_dir = os.path.join(ROOT, "public/catalog/2027")
    for f in os.listdir(cat_dir):
        if not f.endswith(".webp") or f in want or f in src_text:
            continue
        os.remove(os.path.join(cat_dir, f))
        stem = f[:-5]
        if os.path.exists(os.path.join(ROOT, "media-src/clean", stem + ".png")):
            os.remove(os.path.join(ROOT, "media-src/clean", stem + ".png"))
        manifest.pop(stem, None)
        pruned += 1
    # niqobi qolgan, lekin rasmi endi job'da yo'q yozuvlar
    want_stems = {w[:-5] for w in want}
    for stem in [k for k in manifest if k not in want_stems]:
        manifest.pop(stem, None)
        mp = os.path.join(ROOT, "media-src/clean", stem + ".png")
        if os.path.exists(mp):
            os.remove(mp)
        pruned += 1
    if pruned:
        json.dump(dict(sorted(manifest.items())), open(manifest_path, "w"), ensure_ascii=False, indent=1)
        print(f"yetim rasm/niqob o'chirildi: {pruned}")
    total = 0
    for _r, _d, _f in os.walk(os.path.join(ROOT, "public/catalog/2027")):
        total += len(_f)
    print(f"webp ok={ok} (fonsiz={cut}, niqobi-eskirgan={stale}) manbasiz-saqlandi={kept} fail={fail} "
          f"files_in_2027={total}")


if __name__ == "__main__":
    main()
