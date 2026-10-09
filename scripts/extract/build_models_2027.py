#!/usr/bin/env python3
"""SPS Plast — `data/models-2027.json` generator (redesign-2027, bosqich 0).

Manbalar (ustuvorlik bilan, docs/design-handoff/data-sources/README.md bo'yicha):
  1. SPS_yakuniy_jadval.xlsx            — trotuar modellari (asosiy)
  2. SPS_real_malumotlar_bazasi.xlsx    — fasad/dekor/skameyka + surat↔model bog'lanishi
  3. src/data/catalog.json (2026)       — faqat RASM manbai sifatida (studiya fotolari)

Qoidalar:
  * Raqam o'ylab topilmaydi. Manbada yo'q bo'lsa -> null (+ docs/data-questions.md).
  * Tarjimalar (ru kirill / en) repoda YO'Q (yakuniy PDF kutilmoqda) -> null.
  * Bo'limlar: trotuar = yakuniy jadval; fasad/dekor/skameyka = 3-varaq,
    bo'limga tegishligi docs/REAL-CATALOG.md 2.B tasnifi bo'yicha (savol sifatida belgilangan).
  * Skript deterministik: bir xil manba -> bir xil JSON.

Chiqish:
  data/models-2027.json          — sayt o'qiydigan yagona katalog
  data/image-jobs-2027.json      — build_images_2027.py uchun manba->nishon ro'yxati
  docs/data-questions.md         — biznesdan so'raladigan savollar (generator yozadi)
"""
import json
import os
import re
import unicodedata

import openpyxl

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
HANDOFF_XLSX = os.path.join(ROOT, "docs/design-handoff/data-sources/SPS_yakuniy_jadval.xlsx")
REAL_XLSX = os.path.join(ROOT, "docs/design-handoff/data-sources/SPS_real_malumotlar_bazasi.xlsx")
CATALOG_2026 = os.path.join(ROOT, "src/data/catalog.json")
OUT_JSON = os.path.join(ROOT, "data/models-2027.json")
OUT_TS = os.path.join(ROOT, "src/data/models2027.ts")
OUT_JOBS = os.path.join(ROOT, "data/image-jobs-2027.json")
OUT_QUESTIONS = os.path.join(ROOT, "docs/data-questions.md")

SECTION_OF_PREFIX = {  # docs/REAL-CATALOG.md 2.B tasnifi (2026 sayt kategoriyalari)
    "fasad": ["fasad", "beeline", "kirpich", "quba", "qubba", "rus ", "rus2", "rus3",
              "labirint", "brilliant", "shershaviy", "3d"],
    "dekor": ["karniz", "pilyastr", "kapitel", "sokol", "kalonna", "nakonechnik", "zina", "rom "],
    "skameyka": ["skameyka"],
}

# HANDOFF.md 5-bo'lim: "Ko'p so'raladigan" tartibi (kod bo'yicha)
POPULARITY = ["70", "01", "85", "83", "42", "89", "F17", "Z05", "30", "22", "64", "05"]

QUESTIONS: list[str] = []

# Qo'lda qo'shiladigan, generator qayta yozsa ham yo'qolmaydigan savollar.
MANUAL_QUESTIONS: list[str] = [
    "Kontakt handledari zid: eski saytda Telegram @sps_stone va Instagram sps.stone, "
    "HANDOFF 1-bo'limda @spsplastuz va @spsplast.uz. Qaysi biri to'g'ri?",
    "PDF katalog: sayt hozircha 2026 (uz, 130 model) PDF'ga havola beradi. "
    "2027 uch tilli PDF qachon tayyor bo'ladi va qayerga joylanadi?",
    "Bo'lim nomlari RU/EN (hozir: Тротуарная плитка / Paving slabs ...) — yakuniy PDF'dagi "
    "rasmiy nomlar bilan almashtirilishi kerak.",
    "E-pochta: HANDOFF'da [E-POCHTA] placeholder, eski saytda stoneprofyservise@mail.ru edi. "
    "Yangi saytda ko'rsatiladimi?",
]


def q(text: str) -> None:
    if text not in QUESTIONS:
        QUESTIONS.append(text)


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s or "")).lower()
    s = re.sub(r"[«»\"'().,/·—–\-]", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKD", str(s)).lower()
    s = s.replace("‘", "").replace("’", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def num(s) -> str | None:
    """Manbadagi sonni '3,52' ko'rinishiga keltiradi (uz o'nlik vergul)."""
    if s is None:
        return None
    t = str(s).strip().replace(",", ".")
    if not t or t == "-":
        return None
    try:
        v = float(t)
    except ValueError:
        return None
    txt = f"{v:.3f}".rstrip("0").rstrip(".")
    return txt.replace(".", ",")


def parse_molds_cell(cell: str):
    """Yakuniy jadval 'Qoliplar' katagi -> molds[] (A|B|V bo'laklari)."""
    molds = []
    if not cell:
        return molds
    parts = [p.strip() for p in str(cell).split("|")]
    letters = "ABC"
    for i, part in enumerate(parts):
        letter = letters[i] if i < len(letters) else "D"
        m_lab = re.match(r"^([A-Z])\s*:", part)
        if m_lab:
            letter = m_lab.group(1)
            part = part[m_lab.end():]
        size = None
        m_size = re.search(r"(\d{2,3})\s*[×x]\s*(\d{2,3})(?:\s*[×x]\s*(\d{2,3}))?\s*mm", part)
        if m_size:
            a, b, c = m_size.groups()
            size = f"{a}×{b}" + (f"×{c}" if c else "")
            depth = c
        else:
            depth = None
            m_cm = re.search(r"(\d{1,3}(?:[.,]\d+)?)\s*[×x]\s*(\d{1,3}(?:[.,]\d+)?)", part)
            if m_cm:  # kitobcha uslubi: sm da yozilgan (30×40, 17,5×17,5)
                a, b = m_cm.groups()
                size = f"{int(round(float(a.replace(',', '.')) * 10))}×{int(round(float(b.replace(',', '.')) * 10))}"
            m_ch = re.search(r"chuq\.?\s*([\d.,]+)\s*sm", part)
            if m_ch:
                depth = str(int(round(float(m_ch.group(1).replace(",", ".")) * 10)))
        g = None
        m_g = re.search(r"([\d.,]+)\s*g\b", part)
        if m_g:
            g = int(round(float(m_g.group(1).replace(",", "."))))
        per = None
        # "1 m² ga 11 dona" / "15 + 15 dona". Avvalgi variant `[\d.,]+` bilan
        # vergulni ham ushlab, per="," chiqarar edi — endi faqat raqam.
        m_d = re.search(r"(\d+(?:[.,]\d+)?)\s*(?:\+\s*(\d+(?:[.,]\d+)?)\s*)?dona", part)
        if m_d:
            first = num(m_d.group(1))
            second = num(m_d.group(2)) if m_d.group(2) else None
            per = f"{first} + {second}" if second else first
        if size is None and depth is None and g is None and per is None:
            continue
        molds.append({"l": letter, "size": size, "depth": depth, "g": g, "_per": per})
    return molds


def load_trotuar():
    wb = openpyxl.load_workbook(HANDOFF_XLSX, data_only=True)
    ws = wb["Yakuniy jadval"]
    models = []
    for row in list(ws.iter_rows(values_only=True))[2:]:
        bet, code, name, manba, molds_cell, kg, kg_old, holat = (list(row) + [None] * 8)[:8]
        if not name:
            continue
        holat = str(holat or "").strip()
        if holat == "olib tashlanadi":
            q(f"Model `{name}` (bet {bet}) 'olib tashlanadi' deb belgilangan — katalogga kiritilmadi. Tasdiqlang.")
            continue
        name = re.sub(r"\s*\(oldin:.*?\)", "", str(name)).strip()
        name = re.sub(r"\s*—\s*nomi aniqlanadi$", "", name).strip()
        code = None if code in (None, "YANGI") else str(code).strip().zfill(2)
        if code is None:
            q(f"`{name}` modeli yangi qo'shilmoqchi, lekin katalog kodi berilmagan (yakuniy jadval, bet {bet}). Kodni biznes bersin.")
        molds = parse_molds_cell(molds_cell)
        if not molds:
            q(f"`{name}` uchun qolip o'lchami/vazni o'qilmadi (manba: {manba}).")
        tiles = []
        for m in molds:
            per = m.pop("_per", None)
            tiles.append({"l": m["l"], "size": m["size"], "per": per, "cap": None})
        if not kg:
            q(f"`{name}` uchun '1 m², kg (yakuniy)' yo'q — kalkulyator vaznni ko'rsatmaydi.")
        models.append({
            "key": f"t{code or slugify(name)}",
            "code": code,
            "slug": f"{code}-{slugify(name)}" if code else slugify(name),
            "section": "trotuar",
            "name": {"uz": name, "ru": None, "en": None},
            "subtitle": {"uz": None, "ru": None, "en": None},
            "kg": num(kg),
            "molds": molds,
            "tiles": tiles,
            "specs": [],
            "sizeEstimated": False,
            "images": {"scene": None, "sceneSm": None, "molds": {}, "tiles": {}},
            "_src": str(manba or ""),
            "_name_norm": norm(name),
        })
    return models


def load_other_sections():
    """3-varaq (fasad/dekor/skameyka qoliplari). Faqat nomi VA o'lchovi bor qatorlar."""
    wb = openpyxl.load_workbook(REAL_XLSX, data_only=True)
    ws = wb["3 Fasad qoliplari"]
    seen: dict[str, dict] = {}
    for row in list(ws.iter_rows(values_only=True))[3:]:
        dsc, name, size, depth, dona, abs_kg, pp_kg, izoh = (list(row) + [None] * 8)[:8]
        name = str(name or "").strip()
        if not name or name == "o'qilmadi" or name.startswith("("):
            continue
        base = re.sub(r"\s*\d+\s*[×x]\s*\d+.*$", "", name).strip()
        key = norm(base)
        has_nums = any(v not in (None, "") for v in (size, depth, dona, abs_kg, pp_kg))
        if key in seen:
            if has_nums and not seen[key]["_has_nums"]:
                seen[key].update(_dsc=dsc, _size=size, _depth=depth, _dona=dona,
                                 _abs=abs_kg, _pp=pp_kg, _has_nums=True, _izoh=izoh)
            continue
        seen[key] = {"name": base, "_dsc": dsc, "_size": size, "_depth": depth, "_dona": dona,
                     "_abs": abs_kg, "_pp": pp_kg, "_has_nums": has_nums, "_izoh": izoh}
    models = []
    for key, r in seen.items():
        if not r["_has_nums"]:
            continue  # raqamsiz qator -> ma'lumot yetarli emas (savolga chiqadi)
        low = key + " "
        section = next((s for s, prefs in SECTION_OF_PREFIX.items() if any(p in low for p in prefs)), None)
        if section is None:
            q(f"3-varaqdagi `{r['name']}` qaysi bo'limga kiradi (fasad / dekor / zabor)?")
            continue
        size = None
        m = re.search(r"(\d{2,3})\s*[×x]\s*(\d{2,3})", str(r["_size"] or ""))
        if m:
            size = f"{int(m.group(1)) * 10}×{int(m.group(2)) * 10}"
        depth = None
        if r["_depth"]:
            depth = str(int(round(float(str(r["_depth"]).replace(",", ".")) * 10)))
        per = num(r["_dona"])
        molds = [{"l": "A", "size": size, "depth": depth, "g": None}]
        tiles = [{"l": "A", "size": size, "per": per, "cap": None}]
        specs = []
        if r["_abs"]:
            specs.append({"k": {"uz": "ABS, kg/m²", "ru": None, "en": None},
                          "v": {"uz": num(r["_abs"]), "ru": None, "en": None}})
        if r["_pp"]:
            specs.append({"k": {"uz": "PP, kg/m²", "ru": None, "en": None},
                          "v": {"uz": num(r["_pp"]), "ru": None, "en": None}})
        models.append({
            "key": f"{section[0]}-{slugify(r['name'])}",
            "code": None,
            "slug": slugify(r["name"]),
            "section": section,
            "name": {"uz": r["name"], "ru": None, "en": None},
            "subtitle": {"uz": None, "ru": None, "en": None},
            "kg": num(r["_abs"]),  # menejer varag'ida ABS vazni asosiy deb kelishilgan
            "molds": molds,
            "tiles": tiles,
            "specs": specs,
            "sizeEstimated": True,
            "images": {"scene": None, "sceneSm": None, "molds": {}, "tiles": {}},
            "_src": f"3-varaq {r['_dsc']}",
            "_name_norm": key,
        })
    q("Zabor panellari bo'limi uchun repoda hech qanday manba yo'q (HANDOFF: 10 model). "
      "Yakuniy PDF kelguncha bo'lim bo'sh qoladi.")
    return models


def load_image_sources(models):
    """Rasm manbalari: 2026 studiya fotolari (nom bo'yicha) yoki 5-varaq DSC bog'lanishi."""
    cat = json.load(open(CATALOG_2026))
    prods = {}
    for p in cat["products"]:
        uz = next(t for t in p["translations"] if t["locale"] == "uz")
        # 2026 nomi: «Floriya» qolipi -> floriya (faqat aniq moslik qabul qilinadi)
        key = norm(re.sub(r"\s*qolipi$", "", uz["name"].replace("«", "").replace("»", "")))
        prods.setdefault(key, p)
    wb = openpyxl.load_workbook(REAL_XLSX, data_only=True)
    ws = wb["5 Surat-model"]
    have = {re.match(r"(DSC\d+)", f).group(1): f
            for f in os.listdir(os.path.join(ROOT, "media-src/factory")) if re.match(r"DSC\d", f)}
    sheet5 = []
    for row in list(ws.iter_rows(values_only=True))[3:]:
        dsc, _guruh, model, _izoh, conf = (list(row) + [None] * 5)[:5]
        if not dsc or not model:
            continue
        d = str(dsc).strip()
        if d in have:
            nums = {int(x) for x in re.findall(r"№\s*(\d+)", str(model))}
            sheet5.append((conf, norm(model), have[d], nums))
    jobs, stats = [], {"studio": 0, "dsc": 0, "none": 0}
    used_dsc = set()
    for m in models:
        target = m["slug"]
        p = prods.get(m["_name_norm"])  # faqat aniq nom mosligi — noto'g'ri rasm xavfli
        if p:
            media = {x["type"]: x["url"] for x in p["media"]}
            mold = media.get("MAIN")
            if mold:
                jobs.append({"src": f"public{mold}", "dst": f"public/catalog/2027/{m['section']}-{target}-mold-a.webp", "w": 800})
                m["images"]["molds"]["A"] = f"/catalog/2027/{m['section']}-{target}-mold-a.webp"
            tile = media.get("FINISHED_RESULT")
            if tile:
                jobs.append({"src": f"public{tile}", "dst": f"public/catalog/2027/{m['section']}-{target}-tile-a.webp", "w": 800})
                m["images"]["tiles"]["A"] = f"/catalog/2027/{m['section']}-{target}-tile-a.webp"
            env = media.get("USAGE")
            if env:
                jobs.append({"src": f"public{env}", "dst": f"public/catalog/2027/{m['section']}-{target}-scene.webp", "w": 1400})
                jobs.append({"src": f"public{env}", "dst": f"public/catalog/2027/{m['section']}-{target}-scene-sm.webp", "w": 720})
                m["images"]["scene"] = f"/catalog/2027/{m['section']}-{target}-scene.webp"
                m["images"]["sceneSm"] = f"/catalog/2027/{m['section']}-{target}-scene-sm.webp"
            stats["studio"] += 1
            continue
        hit = next((s for s in sheet5 if s[0] == "ishonchli" and m["_name_norm"] and m["_name_norm"] in s[1]), None) \
            or next((s for s in sheet5 if s[0] == "taxminiy" and m["_name_norm"] and m["_name_norm"] in s[1]), None)
        if hit is None:  # kitobcha raqami orqali bog'lash: "Kitobcha №56" <-> "(№56)"
            m_num = re.search(r"Kitobcha №\s*(\d+)", m.get("_src", ""))
            if m_num:
                n = int(m_num.group(1))
                hit = next((s for s in sheet5 if s[0] == "ishonchli" and n in s[3]), None) \
                    or next((s for s in sheet5 if s[0] == "taxminiy" and n in s[3]), None)
        if hit and hit[2] not in used_dsc:
            used_dsc.add(hit[2])
            jobs.append({"src": f"media-src/factory/{hit[2]}", "dst": f"public/catalog/2027/{m['section']}-{target}-mold-a.webp", "w": 800})
            m["images"]["molds"]["A"] = f"/catalog/2027/{m['section']}-{target}-mold-a.webp"
            stats["dsc"] += 1
        else:
            stats["none"] += 1
            q(f"`{m['name']['uz']}` uchun repoda rasm topilmadi (2026 studiya + 5-varaq DSC). Render zip kutilmoqda.")
    return jobs, stats


def main():
    models = load_trotuar() + load_other_sections()
    for i, m in enumerate(models):
        if m["code"] in POPULARITY:
            m["_pop"] = POPULARITY.index(m["code"])
        else:
            m["_pop"] = 1000 + i
    models.sort(key=lambda m: (m["_pop"], m["slug"]))
    jobs, stats = load_image_sources(models)
    for m in models:
        m.pop("_name_norm", None)
        m.pop("_src", None)
        m.pop("_pop", None)
    payload = {
        "$comment": "GENERATED — scripts/extract/build_models_2027.py. Qo'lda tahrirlanmasin!",
        "version": "2027-0",
        "generatedAt": "2026-10-09",
        "source": "docs/design-handoff/data-sources/*.xlsx + src/data/catalog.json (rasmlar)",
        "sections": ["trotuar", "fasad", "zabor", "dekor", "skameyka"],
        "models": models,
    }
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    json.dump(payload, open(OUT_JSON, "w"), ensure_ascii=False, indent=1)
    ts = (
        "// GENERATED — scripts/extract/build_models_2027.py. Qo'lda tahrirlanmasin!\n"
        "// Node testlari JSON import qila olmasligi uchun katalog .ts modul sifatida ham yoziladi.\n"
        "export const models2027 = "
        + json.dumps(models, ensure_ascii=False)
        + ";\n"
    )
    open(OUT_TS, "w").write(ts)
    json.dump(jobs, open(OUT_JOBS, "w"), ensure_ascii=False, indent=1)
    counts = {}
    for m in models:
        counts[m["section"]] = counts.get(m["section"], 0) + 1
    lines = [
        "# Ma'lumot savollari (biznesdan javob kutiladi)",
        "",
        "> Bu fayl `scripts/extract/build_models_2027.py` tomonidan qayta yoziladi.",
        "> Har bir savol manba fayl va katakka ishora qiladi. Javob kelgacha saytda `null` / `[...]` qoladi.",
        "",
        f"Jami model: **{len(models)}** (HANDOFF tasdiqlagan: 152). Bo'limlar: "
        + ", ".join(f"{k} {v}" for k, v in counts.items()),
        "",
        "## Bloker: yakuniy katalog PDF va render zip'lari repoda yo'q",
        "",
        "- `SPS_katalog_A.pdf`, `_RU.pdf`, `_EN.pdf` — 152 model, 3 til, bo'lim taqsimoti (91/26/10/18/7), kodlar (F17, Z05...), RU kirill va EN nomlar, subtitle/note matnlari.",
        "- `SPS_blender_yakuniy*.zip`, `bgeraser_results_*.zip` — sahna renderlari va fon tozalangan qolip/plitka suratlari.",
        "- Ular kelguncha: ru/en nomlar `null` (sayt uz nomiga fallback qiladi), rasmlar 2026 studiya fotolari va 5-varaq DSC bog'lanishidan olinadi.",
        "",
        "## Savollar",
        "",
    ]
    lines += [f"{i}. {t}" for i, t in enumerate(QUESTIONS + MANUAL_QUESTIONS, 1)]
    open(OUT_QUESTIONS, "w").write("\n".join(lines) + "\n")
    print(f"models={len(models)} sections={counts} images={stats} questions={len(QUESTIONS)} jobs={len(jobs)}")


if __name__ == "__main__":
    main()
