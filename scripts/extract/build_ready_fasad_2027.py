#!/usr/bin/env python3
"""Fasad: tayyor mahsulotlar va qolip rasmlari — katalog agentining manba to'plamidan (2026-11-23).

  python3 scripts/extract/build_ready_fasad_2027.py <ochilgan ZIP papkasi>   # data/fasad.json + images/fasad/

Manba (SPS_sayt_katalog_1_fasad.zip): 80 pozitsiya, har biri uchun <KOD>-mahsulot.png (fonsiz),
<KOD>-qolip.png (PP + ABS qolip, fonsiz), <KOD>-sahna.jpg; fasad toshida (F23–F26) <KOD>-terilgan.jpg.

Natija:
  public/catalog/2027/tayyor-<slug>-scene.webp / -scene-sm.webp   tayyor mahsulot (shaffof, kvadrat)
  public/catalog/2027/tayyor-<slug>-fasad.webp                     fasaddagi ko'rinish
  public/catalog/2027/tayyor-<slug>-terilgan.webp                  fasad toshi devorda (F23–F26)
  public/catalog/2027/<bo'lim>-<qolip slug>-qolip-3d.webp          qolip (PP + ABS) — qolip kartochkasi va sahifasi
  public/catalog/2027/<bo'lim>-<qolip slug>-mahsulot-3d.webp       shu qolipdan quyilgan mahsulot (qolip sahifasida)
  scripts/catalog-add-2026-11-23-tayyor-fasad.json  `add` (80 tayyor mahsulot) + `moldPer`
  scripts/catalog-add-2026-11-24-fasad-qolip.json   `refresh` (80 qolip: yangi qolip/mahsulot rasmi, sahna o'zgarmaydi)
  scripts/catalog-keep-2026-11-24.txt               eski qolip rasmlari — bazada sync'gacha kerak
  → bazaga: `npm run catalog:sync -- <fayl>` (ikkala json ham).

Qoidalar:
  - KRN-004 ikki mahsulotda (18×120 va 35×120). Agent 35×120 ga KRN-013 ni taklif qilgan — SPS tasdiqlamaguncha
    saytda bosma katalogdagi KRN-004 qoladi; farq slug va o'lchamda.
  - Katalogdagi "Толщина" = qolip chuqurligi, mahsulot qalinligi emas → tayyor mahsulotda ko'rsatilmaydi
    (faqat fasad toshida 15 mm — u alohida berilgan).
  - Mahsulot vazni manbada yo'q — bo'sh. 1 m² dagi soni faqat termopanellarda.
"""
import json
import os
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_IMG = os.path.join(ROOT, "public", "catalog", "2027")
OUT_READY = os.path.join(ROOT, "scripts", "catalog-add-2026-11-23-tayyor-fasad.json")
OUT_MOLDS = os.path.join(ROOT, "scripts", "catalog-add-2026-11-24-fasad-qolip.json")
OUT_KEEP = os.path.join(ROOT, "scripts", "catalog-keep-2026-11-24.txt")

# Agent bo'limi (section_key) → tayyor mahsulot bo'limi (migratsiya 0004).
READY_SECTION = {
    "termopanel": "tayyor_termopanel", "bilayn": "tayyor_bilayn", "dekor": "tayyor_dekor", "karniz": "tayyor_karniz",
    "tyaga": "tayyor_tyaga", "pilyastra": "tayyor_pilyastra", "kapitel": "tayyor_kapitel", "tsokol": "tayyor_tsokol",
    "tosh": "tayyor_tosh",
}
UZ_FIX = {"Mramor": "Marmar", "Penoplast": "Penoplast", "Bazalt": "Bazalt"}


def L(uz, ru, en):
    return {"uz": uz, "ru": ru, "en": en}


def dot(s, uz=False):
    """"Пенопласт / Базальт", "Травертин, Мрамор" → "A · B"."""
    parts = [p.strip() for p in s.replace("/", ",").split(",") if p.strip()]
    return " · ".join(UZ_FIX.get(p, p) if uz else p for p in parts)


def run(cmd):
    subprocess.run(cmd, check=True)


def cutout(src, dst, size, pad=0.07, quality=82):
    """Fonsiz PNG → trim → markazda kvadrat (chetdan `pad`) → WebP (alfa saqlanadi)."""
    inner = round(size * (1 - 2 * pad))
    run([
        "convert", src, "-trim", "+repage", "-filter", "Lanczos", "-resize", f"{inner}x{inner}",
        "-background", "none", "-gravity", "center", "-extent", f"{size}x{size}",
        "-strip", "-quality", str(quality), "-define", "webp:alpha-quality=90", "-define", "webp:method=6", dst,
    ])


def photo(src, dst, width, quality=74):
    run(["convert", src, "-resize", f"{width}x>", "-strip", "-quality", str(quality), "-define", "webp:method=6", dst])


def add_mold_images(r, mold, stem, img, web, old_refresh, refresh, keep):
    cutout(img(r["img_qolip"]), os.path.join(OUT_IMG, f"{stem}-qolip-3d.webp"), 800)
    cutout(img(r["img_mahsulot"]), os.path.join(OUT_IMG, f"{stem}-mahsulot-3d.webp"), 800)
    new_molds = {"A": web(f"{stem}-qolip-3d.webp")}
    new_tiles = {"A": web(f"{stem}-mahsulot-3d.webp")}
    prev = old_refresh.get(mold["slug"], {})
    cur = mold["images"]
    # bazada hali eski yo'l turgan bo'lishi mumkin — fayl sync'gacha o'chmasin
    for p in [*cur["molds"].values(), *cur["tiles"].values()]:
        if p and p not in (new_molds["A"], new_tiles["A"]):
            keep.add(p)
    refresh[mold["slug"]] = {
        "scene": prev.get("scene") or cur["scene"],
        "sceneSm": prev.get("sceneSm") or cur["sceneSm"],
        "molds": new_molds,
        "tiles": new_tiles,
    }


def main():
    src_dir = os.path.abspath(sys.argv[1])
    rows = json.load(open(os.path.join(src_dir, "data", "fasad.json"), encoding="utf-8"))
    models = {m["key"]: m for m in json.load(open(os.path.join(ROOT, "data", "models-2027.json"), encoding="utf-8"))["models"]}
    old_refresh = {}
    if os.path.exists(OUT_MOLDS):
        old_refresh = json.load(open(OUT_MOLDS, encoding="utf-8")).get("refresh", {})
    keep = set()

    def img(rel):
        return os.path.join(src_dir, rel)

    def web(name):
        return f"/catalog/2027/{name}"

    add, refresh, mold_per = [], {}, {}
    for r in rows:
        mold = models[r["site_key"]]
        if mold["section"].startswith("tayyor_"):
            raise SystemExit(f"{r['site_key']}: qolip emas")
        slug = f"{mold['slug']}-tayyor"
        stem = f"{mold['section']}-{mold['slug']}"

        # --- qolip katalogi: PP + ABS qolip va undan quyilgan mahsulot; sahna (3D) o'zgarmaydi.
        # Tirik surat (nomida `-3d` yo'q) bor qolipga tegilmaydi — u render'dan ustun.
        cur = mold["images"]
        live = any(p and not p.endswith("-3d.webp") for p in [*cur["molds"].values(), *cur["tiles"].values()])
        if not live:
            add_mold_images(r, mold, stem, img, web, old_refresh, refresh, keep)

        # --- tayyor mahsulot
        cutout(img(r["img_mahsulot"]), os.path.join(OUT_IMG, f"tayyor-{slug}-scene.webp"), 1100, pad=0.06)
        cutout(img(r["img_mahsulot"]), os.path.join(OUT_IMG, f"tayyor-{slug}-scene-sm.webp"), 600, pad=0.06)
        images = {"scene": web(f"tayyor-{slug}-scene.webp"), "sceneSm": web(f"tayyor-{slug}-scene-sm.webp"),
                  "molds": {}, "tiles": {}}
        if r.get("img_sahna"):
            photo(img(r["img_sahna"]), os.path.join(OUT_IMG, f"tayyor-{slug}-fasad.webp"), 1400)
            images["tiles"]["A"] = web(f"tayyor-{slug}-fasad.webp")
        if r.get("img_terilgan"):
            photo(img(r["img_terilgan"]), os.path.join(OUT_IMG, f"tayyor-{slug}-terilgan.webp"), 1000)
            images["tiles"]["B"] = web(f"tayyor-{slug}-terilgan.webp")

        specs = []
        stone = r["section_key"] == "tosh"
        if stone and r.get("thickness_mm"):
            t = r["thickness_mm"]
            specs.append({"k": L("Qalinligi", "Толщина", "Thickness"), "v": L(f"{t} mm", f"{t} мм", f"{t} mm")})
        if r.get("base_ru"):
            label = L("Material", "Материал", "Material") if stone else L("Asosi", "Основа", "Core")
            specs.append({"k": label, "v": L(dot(r["base_uz"], True), dot(r["base_ru"]), dot(r["base_en"]))})
        if r.get("colors_ru"):
            specs.append({"k": L("Ranglari", "Цвета", "Colours"),
                          "v": L(dot(r["colors_uz"], True), dot(r["colors_ru"]), dot(r["colors_en"]))})

        per = r.get("per_m2")
        per_s = f"{per:g}".replace(".", ",") if per else None
        if per_s:
            mold_per[mold["slug"]] = per_s
        desc = L(r.get("description_uz") or None, r.get("description_ru") or None, r.get("description_en") or None)
        add.append({
            "slug": slug,
            "key": slug,
            "code": mold["code"],
            "section": READY_SECTION[r["section_key"]],
            "name": L(r["name_uz"], r["name_ru"], r["name_en"]),
            "subtitle": dict(mold["subtitle"]),
            "note": desc if any(desc.values()) else None,
            "kg": None,
            "molds": [],
            "tiles": [{"l": "A", "size": r["size_mm"], "per": per_s, "cap": None}],
            "specs": specs,
            "images": images,
        })

    meta = {"source": "SPS_sayt_katalog_1_fasad.zip (katalog agenti, 2026-11-23)"}
    json.dump({**meta, "add": add, "moldPer": mold_per}, open(OUT_READY, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({**meta, "applyStatic": True, "add": [], "refresh": refresh},
              open(OUT_MOLDS, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if os.path.exists(OUT_KEEP):
        keep |= {x.strip() for x in open(OUT_KEEP, encoding="utf-8") if x.strip().startswith("/")}
    with open(OUT_KEEP, "w", encoding="utf-8") as f:
        f.write("# Eski fasad qolip rasmlari: prod baza `catalog-add-2026-11-24-fasad-qolip.json` sync qilinguncha kerak.\n")
        f.write("".join(p + "\n" for p in sorted(keep)))
    print(f"{len(add)} tayyor mahsulot, {len(refresh)} qolip rasmi, {len(keep)} eski fayl saqlanadi")


if __name__ == "__main__":
    main()
