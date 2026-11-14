"""SPS Plast — qolip/plitka rasmlari uchun umumiy yordamchilar (rembg talab qilinmaydi).

`build_images_2027.py` va `remove_bg_2027.py` ikkalasi ham shu modulni ishlatadi:

* `resolve_src()` — `image-jobs-2027.json` dagi eski `public/catalog/2026/...` yo'llari
  (Stage 5 da o'chirilgan) `media-src/studio-2026/` dagi arxiv nusxaga yo'naltiriladi.
* `mask_path()` — `media-src/clean/<dst-nomi>.png`: fonni olib tashlash niqobi
  (8-bit kulrang, manba o'lchamida). Niqoblar repoda saqlanadi — CI va boshqa
  dasturchilarga rembg kerak emas, faqat ImageMagick.
* `compose_cutout()` — manba + niqob -> shaffof WebP: alfa 1px qisqartiriladi va
  yumshatiladi (fon "halo"si qolmasin), obyekt chegarasiga kesiladi, kvadrat
  kanvas markaziga ~7% chekka bilan joylanadi, eng uzun tomon 800px, sifat 82.
"""
import os
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CLEAN_DIR = os.path.join(ROOT, "media-src/clean")
LEGACY_PREFIX = "public/catalog/2026/"
LEGACY_DIR = "media-src/studio-2026/"
PAD = 0.07          # har tomondan chekka (kanvas ulushi)
QUALITY = "82"


def is_cutout_job(dst: str) -> bool:
    """Fonsiz bo'lishi kerak bo'lgan rasmlar: qolip va plitka (sahna emas)."""
    name = os.path.basename(dst)
    return "-mold-" in name or "-tile-" in name


def resolve_src(src: str) -> str:
    """Repo ildiziga nisbatan mavjud manba yo'li (yo'q bo'lsa asl yo'l qaytadi)."""
    if os.path.exists(os.path.join(ROOT, src)):
        return src
    if src.startswith(LEGACY_PREFIX):
        alt = LEGACY_DIR + src[len(LEGACY_PREFIX):]
        if os.path.exists(os.path.join(ROOT, alt)):
            return alt
    return src


def mask_path(dst: str) -> str:
    stem = os.path.splitext(os.path.basename(dst))[0]
    return os.path.join(CLEAN_DIR, stem + ".png")


def _bbox(mask: str):
    """Niqobdagi obyekt chegarasi (alfa > ~3%): (w, h, x, y) yoki None."""
    r = subprocess.run(["convert", mask, "-threshold", "3%", "-format", "%@", "info:"],
                       capture_output=True, text=True)
    g = r.stdout.strip()
    if r.returncode != 0 or "x" not in g:
        return None
    wh, x, y = g.replace("+", " ").split()
    w, h = wh.split("x")
    w, h, x, y = int(w), int(h), int(x), int(y)
    return (w, h, x, y) if w > 4 and h > 4 else None


def compose_cutout(src: str, mask: str, dst: str, size: int = 800) -> bool:
    """`src` (repo nisbiy) + `mask` (mutlaq) -> `dst` (mutlaq) shaffof kvadrat WebP."""
    src_abs = os.path.join(ROOT, src)
    box = _bbox(mask)
    if box is None or not os.path.exists(src_abs):
        return False
    w, h, x, y = box
    inner = round(size * (1 - 2 * PAD))
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    cmd = [
        "convert", src_abs, "-auto-orient", "-alpha", "off",
        "(", mask, "-colorspace", "gray", "-alpha", "off",
        "-morphology", "Erode", "Disk:1", "-blur", "0x0.6", ")",
        "-compose", "CopyOpacity", "-composite", "-compose", "Over",
        "-crop", f"{w}x{h}+{x}+{y}", "+repage",
        "-filter", "Lanczos", "-resize", f"{inner}x{inner}",
        "-background", "none", "-gravity", "center", "-extent", f"{size}x{size}",
        "-strip", "-quality", QUALITY, "-define", "webp:alpha-quality=90",
        "-define", "webp:method=6", "-define", "webp:exact=false", dst,
    ]
    r = subprocess.run(cmd, capture_output=True)
    return r.returncode == 0 and os.path.exists(dst) and os.path.getsize(dst) > 500


# --------------------------------------------------------------------------
# Katalogni yozish: JSON va sayt o'qiydigan TS modul bitta joydan (build_models + build_images).
# --------------------------------------------------------------------------
import json as _json

MODELS_JSON = os.path.join(ROOT, "data/models-2027.json")
MODELS_TS = os.path.join(ROOT, "src/data/models2027.ts")
TS_HEADER = (
    "// GENERATED — scripts/extract/build_models_2027.py. Qo'lda tahrirlanmasin!\n"
    "// Node testlari JSON import qila olmasligi uchun katalog .ts modul sifatida ham yoziladi.\n"
)


def write_catalog(payload):
    """data/models-2027.json + src/data/models2027.ts — bir xil formatda."""
    _json.dump(payload, open(MODELS_JSON, "w"), ensure_ascii=False, indent=1)
    open(MODELS_TS, "w").write(TS_HEADER + "export const models2027 = "
                               + _json.dumps(payload["models"], ensure_ascii=False) + ";\n")
