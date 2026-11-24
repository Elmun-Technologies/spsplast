#!/usr/bin/env python3
"""Skameyka va yevrozabor: tayyor mahsulotlar + qolip rasmlari — katalog agentining manba to'plamidan (2026-11-23).

  python3 scripts/extract/build_ready_bench_fence_2027.py <ochilgan ZIP papkasi>   # data/{skameyka,zabor}.json + images/

Manba (SPS_sayt_katalog_2_skameyka_zabor.zip): 6 skameyka yon qismi, 9 yevrozabor (Z01–Z09; Z10 bosma katalogda yo'q).

Skameyka:
  - KLASSIK = S02, USIMLIK = S04, PANJARA = S07 (agent `site_code`): qolip sahifasiga haqiqiy qolip surati, quyilgan
    yon qism va (haqiqiy surat bo'lsa) skameyka sahnasi. PANJARA sahnasi 3D — saytdagi 3D sahna qoladi.
  - ROYAL, KOMFORT, MODERN saytda yo'q edi → yangi qolip (kodsiz: bosma katalogda S-kod ishlatilmagan, o'ylab topmaymiz;
    o'lchami katalogda yo'q — SPS tasdiqlashi kerak).
  - Tayyor mahsulot: oq betondan yon qism (bitta skameykaga 2 dona).
Yevrozabor: qolip rasmlariga tegilmaydi (saytda allaqachon haqiqiy qolip surati bor); tayyor panel 500×1900, 50 mm.

Natija: public/catalog/2027/*.webp, scripts/catalog-add-2026-11-24-skameyka-zabor.json (`add` + `refresh`),
eski yo'llar scripts/catalog-keep-2026-11-24.txt ga qo'shiladi. Bazaga: `npm run catalog:sync -- <json>`.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from build_ready_fasad_2027 import L, OUT_IMG, OUT_KEEP, ROOT, cutout, photo  # noqa: E402

OUT = os.path.join(ROOT, "scripts", "catalog-add-2026-11-24-skameyka-zabor.json")


def slugify(s):
    s = s.lower().replace("‘", "").replace("’", "").replace("'", "")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def text(r, field):
    return L(r.get(f"{field}_uz") or None, r.get(f"{field}_ru") or None, r.get(f"{field}_en") or None)


def main():
    src = os.path.abspath(sys.argv[1])
    benches = json.load(open(os.path.join(src, "data", "skameyka.json"), encoding="utf-8"))
    fences = json.load(open(os.path.join(src, "data", "zabor.json"), encoding="utf-8"))
    models = json.load(open(os.path.join(ROOT, "data", "models-2027.json"), encoding="utf-8"))["models"]
    by_code = {m["code"]: m for m in models if m["code"] and not m["section"].startswith("tayyor_")}
    by_slug = {m["slug"]: m for m in models}
    prev = json.load(open(OUT, encoding="utf-8")) if os.path.exists(OUT) else {}
    keep, add, refresh = set(), [], {}

    def img(rel):
        return os.path.join(src, rel)

    def web(name):
        return f"/catalog/2027/{name}"

    def out(name):
        return os.path.join(OUT_IMG, name)

    # ---------------- skameyka
    for r in benches:
        real_scene = r.get("scene_type") == "haqiqiy surat"
        r3d = "" if real_scene else "-3d"  # PANJARA: surat ham, sahna ham 3D
        mold = by_code.get(r.get("site_code") or "")
        if mold is None:
            # yangi qolip (Royal, Komfort, Modern)
            mslug = f"skameyka-{slugify(r['code'])}"
            mold = by_slug.get(mslug) or {"slug": mslug, "section": "skameyka", "code": None}
            stem = f"skameyka-{mslug}"
            cutout(img(r["img_qolip"]), out(f"{stem}-qolip.webp"), 800)
            cutout(img(r["img_mahsulot"]), out(f"{stem}-mahsulot{r3d}.webp"), 800)
            photo(img(r["img_sahna"]), out(f"{stem}-scene{r3d}.webp"), 1400, quality=72)
            photo(img(r["img_sahna"]), out(f"{stem}-scene-sm{r3d}.webp"), 720, quality=72)
            add.append({
                "slug": mslug, "key": mslug, "code": None, "section": "skameyka",
                "name": text(r, "name"), "subtitle": L(None, None, None), "note": text(r, "description"),
                "kg": None,
                "molds": [{"l": "A", "size": r.get("size_mm"), "depth": None, "g": None}],
                "tiles": [{"l": "A", "size": r.get("size_mm"), "per": None, "cap": None}],
                "specs": [],
                "images": {"scene": web(f"{stem}-scene{r3d}.webp"), "sceneSm": web(f"{stem}-scene-sm{r3d}.webp"),
                           "molds": {"A": web(f"{stem}-qolip.webp")}, "tiles": {"A": web(f"{stem}-mahsulot{r3d}.webp")}},
            })
        else:
            stem = f"{mold['section']}-{mold['slug']}"
            cur = (prev.get("refresh") or {}).get(mold["slug"]) or mold["images"]
            cutout(img(r["img_qolip"]), out(f"{stem}-qolip.webp"), 800)
            cutout(img(r["img_mahsulot"]), out(f"{stem}-mahsulot{r3d}.webp"), 800)
            new = {"scene": cur["scene"], "sceneSm": cur["sceneSm"],
                   "molds": {"A": web(f"{stem}-qolip.webp")}, "tiles": {"A": web(f"{stem}-mahsulot{r3d}.webp")}}
            if real_scene:
                photo(img(r["img_sahna"]), out(f"{stem}-scene.webp"), 1400, quality=72)
                photo(img(r["img_sahna"]), out(f"{stem}-scene-sm.webp"), 720, quality=72)
                new["scene"], new["sceneSm"] = web(f"{stem}-scene.webp"), web(f"{stem}-scene-sm.webp")
            refresh[mold["slug"]] = new
            for p in [mold["images"]["scene"], mold["images"]["sceneSm"], *mold["images"]["molds"].values(),
                      *mold["images"]["tiles"].values()]:
                if p and p not in (new["scene"], new["sceneSm"], *new["molds"].values(), *new["tiles"].values()):
                    keep.add(p)

        slug = f"{mold['slug']}-tayyor"
        # Asosiy rasm — tayyor skameykaning to'liq surati (`-foto`: sayt uni kesmasdan, fonli surat sifatida ko'rsatadi).
        # Avtomatik fonsiz kesmalar (`-mahsulot.png`) ishlatilmaydi: Klassik/Modernda skameykaning yarmi kesilgan edi.
        photo(img(r["img_sahna"]), out(f"tayyor-{slug}-foto{r3d}.webp"), 1400, quality=76)
        photo(img(r["img_sahna"]), out(f"tayyor-{slug}-foto-sm{r3d}.webp"), 720, quality=76)
        ready_images = {"scene": web(f"tayyor-{slug}-foto{r3d}.webp"), "sceneSm": web(f"tayyor-{slug}-foto-sm{r3d}.webp"),
                        "molds": {}, "tiles": {}}
        refresh[slug] = ready_images  # bazada eski (kesma) rasm bilan turgan qatorlar ham yangilansin
        for old in (f"tayyor-{slug}-scene.webp", f"tayyor-{slug}-scene-sm.webp", f"tayyor-{slug}-sahna{r3d}.webp"):
            if os.path.exists(out(old)):
                keep.add(web(old))
        n = r.get("per_bench")
        specs = [{"k": L("Material", "Материал", "Material"), "v": text(r, "product_material")}]
        if n:
            specs.append({"k": L("Bitta skameykaga", "На одну скамейку", "Per bench"),
                          "v": L(f"{n} dona", f"{n} шт.", f"{n} pcs")})
        add.append({
            "slug": slug, "key": slug, "code": mold.get("code"), "section": "tayyor_skameyka",
            "name": text(r, "name"), "subtitle": L("Skameyka yon qismi", "Боковина скамейки", "Bench side"), "note": text(r, "description"),
            "kg": None, "molds": [],
            "tiles": [{"l": "A", "size": r.get("size_mm"), "per": None, "cap": None}],
            "specs": specs,
            "images": ready_images,
        })

    # ---------------- yevrozabor (faqat tayyor panel; qolip surati saytda bor)
    for r in fences:
        mold = by_code[r["code"]]
        slug = f"{mold['slug']}-tayyor"
        cutout(img(r["img_mahsulot"]), out(f"tayyor-{slug}-scene-3d.webp"), 1100, pad=0.05)
        cutout(img(r["img_mahsulot"]), out(f"tayyor-{slug}-scene-sm-3d.webp"), 600, pad=0.05)
        photo(img(r["img_sahna"]), out(f"tayyor-{slug}-sahna-3d.webp"), 1200, quality=72)
        t = r.get("thickness_mm")
        specs = []
        if t:
            specs.append({"k": L("Qalinligi", "Толщина", "Thickness"), "v": L(f"{t} mm", f"{t} мм", f"{t} mm")})
        specs.append({"k": L("Material", "Материал", "Material"), "v": text(r, "product_material")})
        add.append({
            "slug": slug, "key": slug, "code": mold["code"], "section": "tayyor_zabor",
            "name": text(r, "name"), "subtitle": L("Yevrozabor paneli", "Панель еврозабора", "Euro fence panel"), "note": text(r, "description"),
            "kg": None, "molds": [],
            "tiles": [{"l": "A", "size": r.get("size_mm"), "per": None, "cap": None}],
            "specs": specs,
            "images": {"scene": web(f"tayyor-{slug}-scene-3d.webp"), "sceneSm": web(f"tayyor-{slug}-scene-sm-3d.webp"),
                       "molds": {}, "tiles": {"A": web(f"tayyor-{slug}-sahna-3d.webp")}},
        })

    json.dump({"source": "SPS_sayt_katalog_2_skameyka_zabor.zip (katalog agenti, 2026-11-23)", "applyStatic": True,
               "add": add, "refresh": refresh}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    old = [x.rstrip("\n") for x in open(OUT_KEEP, encoding="utf-8")] if os.path.exists(OUT_KEEP) else []
    head = [x for x in old if not x.startswith("/")]
    paths = sorted({x for x in old if x.startswith("/")} | keep)
    open(OUT_KEEP, "w", encoding="utf-8").write("\n".join(head + paths) + "\n")
    print(f"add={len(add)} refresh={len(refresh)} keep+={len(keep)}")


if __name__ == "__main__":
    main()
