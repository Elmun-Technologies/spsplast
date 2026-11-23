#!/usr/bin/env python3
"""Tayyor fasad mahsulotlari (2026-11-23): bosma katalog "SPS_katalog_FASAD_MAHSULOT_A4" PDF → sayt.

  python3 scripts/extract/build_ready_fasad_2027.py <MAHSULOT.pdf>

Natija:
  public/catalog/2027/tayyor-<slug>-scene.webp / -scene-sm.webp  — mahsulotning o'zi (katalog sahifasidagi studiya surati)
  public/catalog/2027/tayyor-<slug>-fasad.webp                   — fasaddagi ko'rinish (o'ng sahifa)
  scripts/catalog-add-2026-11-23-tayyor-fasad.json               — `add` (80 ta) + `moldPer` (qolip 1 m²),
                                                                   `npm run catalog:sync -- <fayl>`

Ma'lumot: mundarija (№, nom, kod, sahifa) + har mahsulot sahifasidagi jadval (o'lcham, qalinlik, 1 m², asos, rang).
Nomlar va uz/ru/en tarjimalari — shu koddagi qolip modelidan (data/models-2027.json), chunki katalogda faqat ruscha.
Asl fayllar (fonsiz PNG, jadval) kelsa — shu skript o'rniga o'shalardan yasaladi; slug va bo'limlar o'zgarmaydi.
"""
import json
import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_IMG = os.path.join(ROOT, "public", "catalog", "2027")
OUT_JSON = os.path.join(ROOT, "scripts", "catalog-add-2026-11-23-tayyor-fasad.json")

# Kod prefiksi → tayyor mahsulot bo'limi (migratsiya 0004).
SECTION_BY_PREFIX = {
    "TP": "tayyor_termopanel", "BP": "tayyor_bilayn", "FSD": "tayyor_dekor", "KRN": "tayyor_karniz",
    "NL": "tayyor_tyaga", "PL": "tayyor_pilyastra", "KPL": "tayyor_kapitel", "SL": "tayyor_tsokol", "F": "tayyor_tosh",
}

WORDS = {  # katalogdagi ruscha qiymat → uz / en
    "Пенопласт": ("Penoplast", "EPS foam"), "Базальт": ("Bazalt", "Basalt"),
    "Травертин": ("Travertin", "Travertine"), "Мрамор": ("Marmar", "Marble"), "Бетон": ("Beton", "Concrete"),
}


def L(uz, ru, en):
    return {"uz": uz, "ru": ru, "en": en}


def tr(value):
    parts = [p.strip() for p in value.split("·")]
    uz = " · ".join(WORDS.get(p, (p, p))[0] for p in parts)
    en = " · ".join(WORDS.get(p, (p, p))[1] for p in parts)
    return L(uz, value, en)


def page_text(pdf, p):
    return subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), pdf, "-"], capture_output=True, text=True).stdout


def spaced(word):
    return r"\s*".join(map(re.escape, word))


def toc(pdf):
    txt = subprocess.run(["pdftotext", "-layout", "-f", "1", "-l", "14", pdf, "-"], capture_output=True, text=True).stdout
    blk = txt[txt.index("СОДЕРЖАНИЕ"):]
    out = []
    for n, name, code, page in re.findall(r"(\d{3})\s+([А-ЯЁA-Z0-9][А-ЯЁA-Z0-9 ×]*?)\s+([A-Z]{1,3}-\d{3}|F2\d)\s+(\d{3})", blk):
        m = re.match(r"(\d{3})\s+(.*)", name)
        if m:
            n, name = m.group(1), m.group(2)
        name = re.sub(r"^.*\d{3}\s+", "", name).strip()
        out.append((int(n), name, code, int(page)))
    return sorted(set(out))


def specs(pdf, p):
    lines = page_text(pdf, p).split("\n")
    d = {}

    def below(i, col):
        for k in range(i + 1, min(i + 4, len(lines))):
            seg = lines[k][col:] if len(lines[k]) > col else ""
            if seg.strip():
                return seg.strip()
        return None

    for i, line in enumerate(lines):
        m = re.search(spaced("РАЗМЕР,ММ"), line)
        if m and "size" not in d:
            row = below(i, max(m.start() - 2, 0)) or ""
            if (x := re.search(r"(\d{2,4}×\d{2,4}(?:×\d{1,3})?)", row)):
                d["size"] = x.group(1)
            if (x := re.search(r"(\d+)\s*мм", row)):
                d["thickness"] = x.group(1)
            if (x := re.search(r"([\d,]+)\s*шт", row)):
                d["per"] = x.group(1)
            if (x := re.search(r"Бетон", row)):
                d["material"] = "Бетон"
        for key, label in (("base", "ОСНОВА"), ("color", "ЦВЕТ")):
            m = re.search(spaced(label), line)
            if m and key not in d:
                v = below(i, max(m.start() - 1, 0))
                if v:
                    d[key] = re.split(r"\s{3,}", v)[0]
    return d


def page_images(pdf, p, tmp):
    prefix = os.path.join(tmp, f"p{p}")
    subprocess.run(["pdfimages", "-j", "-f", str(p), "-l", str(p), pdf, prefix], check=True)
    files = sorted(f for f in os.listdir(tmp) if f.startswith(f"p{p}-"))
    sizes = {}
    for f in files:
        w, h = subprocess.run(["identify", "-format", "%w %h", os.path.join(tmp, f)], capture_output=True, text=True).stdout.split()
        sizes[f] = (int(w), int(h))
    page_bg = next((f for f, (w, h) in sizes.items() if h > w * 1.3 and w > 2000), None)  # chap sahifa foni (mahsulot shu yerda)
    # O'ng sahifa: fasaddagi ko'rinish — eng katta qolgan rasm (yotiq 2400×1535 yoki tik 1420×2040; QR 744 va eskiz 900 emas).
    rest = [(w * h, f) for f, (w, h) in sizes.items() if f != page_bg and min(w, h) >= 1000]
    scene = max(rest)[1] if rest else None
    return (os.path.join(tmp, page_bg) if page_bg else None, os.path.join(tmp, scene) if scene else None)


def webp(src, dst, width, crop=None, quality=78):
    cmd = ["convert", src]
    if crop:
        cmd += ["-crop", crop, "+repage"]
    cmd += ["-resize", f"{width}x", "-strip", "-quality", str(quality), "-define", "webp:method=6", dst]
    subprocess.run(cmd, check=True)


def main():
    pdf = sys.argv[1]
    molds = json.load(open(os.path.join(ROOT, "data", "models-2027.json"), encoding="utf-8"))["models"]
    by_code = {}
    for m in molds:
        if m.get("code"):
            by_code.setdefault(m["code"], []).append(m)

    add = []
    with tempfile.TemporaryDirectory() as tmp:
        for n, name_ru, code, page in toc(pdf):
            s = specs(pdf, page)
            cands = by_code.get(code, [])
            # KRN-004 katalogda ikki xil mahsulotda (180 va 350 mm) — o'lcham bo'yicha qolipga bog'lanadi.
            mold = next((m for m in cands if s.get("size") and m["tiles"] and m["tiles"][0]["size"] == s["size"]), cands[0] if cands else None)
            if not mold:
                print("qolip topilmadi:", code, name_ru)
                continue
            slug = f"{mold['slug']}-tayyor"
            prefix = re.match(r"[A-Z]+", code).group(0)
            section = SECTION_BY_PREFIX[prefix]
            bg, scene = page_images(pdf, page, tmp)
            images = {"scene": None, "sceneSm": None, "molds": {}, "tiles": {}}
            if bg:
                # Chap sahifa 2520×3552: yuqoridagi rangli sarlavha va pastdagi jadvalsiz kvadrat — mahsulot shu oraliqda.
                webp(bg, os.path.join(OUT_IMG, f"tayyor-{slug}-scene.webp"), 1100, crop="2520x2520+0+430")
                webp(bg, os.path.join(OUT_IMG, f"tayyor-{slug}-scene-sm.webp"), 600, crop="2520x2520+0+430")
                images["scene"] = f"/catalog/2027/tayyor-{slug}-scene.webp"
                images["sceneSm"] = f"/catalog/2027/tayyor-{slug}-scene-sm.webp"
            if scene:
                webp(scene, os.path.join(OUT_IMG, f"tayyor-{slug}-fasad.webp"), 1400, quality=72)
                images["tiles"]["A"] = f"/catalog/2027/tayyor-{slug}-fasad.webp"
            # Asos jadvalda har doim ham o'qilmaydi (ustun siljiydi): katalogning "Материалы" sahifasi bo'yicha
            # termopanel — penoplast yoki bazalt, qolgan elementlar — penoplast; fasad toshi — beton (asossiz).
            if not s.get("base") and section != "tayyor_tosh":
                s["base"] = "Пенопласт · Базальт" if section == "tayyor_termopanel" else "Пенопласт"
            spec_rows = []
            if s.get("thickness"):
                spec_rows.append({"k": L("Qalinligi", "Толщина", "Thickness"), "v": L(f"{s['thickness']} mm", f"{s['thickness']} мм", f"{s['thickness']} mm")})
            if s.get("base"):
                spec_rows.append({"k": L("Asosi", "Основа", "Core"), "v": tr(s["base"])})
            if s.get("color"):
                spec_rows.append({"k": L("Rangi", "Цвет", "Colour"), "v": tr(s["color"])})
            if s.get("material"):
                spec_rows.append({"k": L("Material", "Материал", "Material"), "v": tr(s["material"])})
            add.append({
                "slug": slug,
                "key": slug,
                "code": code,
                "section": section,
                "name": dict(mold["name"]),
                "subtitle": dict(mold["subtitle"]),
                "kg": None,
                "molds": [],
                "tiles": [{"l": "A", "size": s.get("size") or (mold["tiles"][0]["size"] if mold["tiles"] else None), "per": s.get("per"), "cap": None}],
                "specs": spec_rows,
                "images": images,
            })
            print(f"{n:03d} {code:8s} {section:18s} {slug:40s} {s}")
    # Qolipning 1 m² dagi soni = tayyor mahsulotniki (katalogda ikkalasida bir xil) — qolip sahifasidagi kalkulyator uchun.
    mold_per = {x["slug"][: -len("-tayyor")]: x["tiles"][0]["per"] for x in add if x["tiles"] and x["tiles"][0].get("per")}
    json.dump({"source": os.path.basename(pdf), "add": add, "moldPer": mold_per}, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{len(add)} ta tayyor mahsulot → {os.path.relpath(OUT_JSON, ROOT)}")


if __name__ == "__main__":
    main()
