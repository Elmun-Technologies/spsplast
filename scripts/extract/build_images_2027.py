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
from cutout_2027 import compose_cutout, is_cutout_job, mask_path, resolve_src  # noqa: E402

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
    ok = fail = cut = kept = 0
    failed_dst = set()
    for j in jobs:
        src = resolve_src(j["src"])
        mask = mask_path(j["dst"])
        if is_cutout_job(j["dst"]) and os.path.exists(mask) and \
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
        data = json.load(open(MODELS))
        for m in data["models"]:
            im = m["images"]
            if im["scene"] in failed_dst:
                im["scene"] = None
            if im["sceneSm"] in failed_dst:
                im["sceneSm"] = None
            for k, v in list(im["molds"].items()):
                if v in failed_dst:
                    del im["molds"][k]
            for k, v in list(im["tiles"].items()):
                if v in failed_dst:
                    del im["tiles"][k]
        json.dump(data, open(MODELS, "w"), ensure_ascii=False, indent=1)
    total = 0
    for _r, _d, _f in os.walk(os.path.join(ROOT, "public/catalog/2027")):
        total += len(_f)
    print(f"webp ok={ok} (fonsiz={cut}) manbasiz-saqlandi={kept} fail={fail} "
          f"files_in_2027={total}")


if __name__ == "__main__":
    main()
