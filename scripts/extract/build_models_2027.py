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
CATALOG_2026 = os.path.join(ROOT, "docs/legacy/catalog-2026.json")  # Stage 5: arxiv nusxa
OUT_JSON = os.path.join(ROOT, "data/models-2027.json")
OUT_TS = os.path.join(ROOT, "src/data/models2027.ts")
OUT_JOBS = os.path.join(ROOT, "data/image-jobs-2027.json")
OUT_QUESTIONS = os.path.join(ROOT, "docs/data-questions.md")
CATALOG3D = os.path.join(ROOT, "data/catalog3d-2027.json")       # build_3d_catalog_2027.py
TERMOPANEL = os.path.join(ROOT, "data/termopanel-2027.json")     # build_termopanel_2027.py
OUT_MODEL3D = os.path.join(ROOT, "src/components/model2027/model3d.generated.ts")
OUT_MOVED = os.path.join(ROOT, "data/moved-2027.json")           # build_redirects_2027.py o'qiydi
LIVE_DIR = os.path.join(ROOT, "media-src/live")                  # tirik suratlar (H4)

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
    return models


# --------------------------------------------------------------------------
# 3D katalog (public/3d) — fasad, termopanel, fasad dekor, zabor, dekor, skameyka
# --------------------------------------------------------------------------
# Biznesning to'liq mahsulot ro'yxati 3D paketlarda (data/catalog3d-2027.json):
# kod, ruscha nom, aniq o'lcham va qolip chuqurligi. Bo'limlar admin bazasidagi
# DEFAULT_SECTIONS (src/server/catalog.ts) bilan bir xil kalitlarda.
SECTION_OF_3D_PREFIX = {
    "tp": "termopanel",
    "f": "fasad",
    "bp": "fasad_dekor", "fsd": "fasad_dekor", "nl": "fasad_dekor", "krn": "fasad_dekor",
    "pl": "fasad_dekor", "kpl": "fasad_dekor", "sl": "fasad_dekor",
    "d": "dekor",
    "s": "skameyka",
    "z": "zabor",
}

# Termopanel/fasad dekor: uz nom va tavsif data/termopanel-2027.json dan (xlsx 6-varaq),
# ru/en — 3D katalogdagi ruscha nomdan va quyidagi so'z lug'atidan.
SUBTITLE_I18N = {
    "Termopanel": ("Термопанель", "Thermal panel"),
    "Dekor panel": ("Декор-панель", "Decor panel"),
    "Beeline panel": ("Панель «Билайн»", "Beeline panel"),
    "Tyaga": ("Тяга", "Moulding"),
    "Karniz": ("Карниз", "Cornice"),
    "Pilyastra": ("Пилястра", "Pilaster"),
    "Kapitel baza": ("База капители", "Capital base"),
    "Sokol": ("Цоколь", "Plinth"),
}
EN_WORDS = {
    "kirpich": "Brick", "gladkiy": "Smooth", "beeline": "Beeline", "kuba": "Cuba",
    "pryamaya": "Straight", "kruglaya": "Round", "3d": "3D", "brilliant": "Brilliant",
    "labirint": "Labyrinth", "dekor": "Decor", "kapitel": "Capital", "baza": "base",
    "karniz": "Cornice", "tyaga": "Moulding", "pilyastra": "Pilaster", "riflyoniy": "Fluted",
    "nalichnik": "Window trim", "sokol": "Plinth",
}

# Dekor panellar, skameyka oyoqlari, zabor va fasad plitkalari: termopanel varag'ida yo'q,
# shuning uchun uz/en nomlar shu yerda (ruscha asl nom 3D katalogdan). Biznes admin'da tuzatadi.
NAMES_3D = {
    "d01": ("Ramkali panel", "Framed panel"),
    "d02": ("Ramka, 2 kvadrat", "Frame, 2 squares"),
    "d03": ("Yon tasmali ramka", "Frame with side band"),
    "d04": ("Ramka, 4 kvadrat", "Frame, 4 squares"),
    "d05": ("Ramka, 3 kvadrat", "Frame, 3 squares"),
    "d06": ("Oddiy ramka", "Simple frame"),
    "d07": ("Ramkadagi kvadrat", "Square in a frame"),
    "d08": ("Rombli panjara", "Diamond lattice"),
    "d09": ("3D piramida", "3D pyramid"),
    "d10": ("Ko'p ramkali, keng", "Multi-frame, wide"),
    "d11": ("Ko'p ramkali", "Multi-frame"),
    "d12": ("To'lqinsimon panel", "Wave panel"),
    "d13": ("Tosh panel", "Stone panel"),
    "d14": ("Donador panel", "Grain panel"),
    "d15": ("Tishli friz", "Dentil frieze"),
    "d16": ("Rombli tasmali panel", "Panel with diamond band"),
    "d17": ("Qirrali panel", "Ribbed panel"),
    "d18": ("Keng qirrali panel", "Wide ribbed panel"),
    "z01": ("Yevrozabor «Okovka»", "Euro fence «Wrought»"),
    "z02": ("Yevrozabor «G'unchalar»", "Euro fence «Buds»"),
    "z03": ("Yevrozabor «Reykalar»", "Euro fence «Slats»"),
    "z04": ("Yevrozabor «To'lqinli tosh»", "Euro fence «Wave stone»"),
    "z05": ("Yevrozabor «Gul»", "Euro fence «Flower»"),
    "z06": ("Yevrozabor «Silliq»", "Euro fence «Smooth»"),
    "z07": ("Yevrozabor «G'isht va tosh»", "Euro fence «Brick and stone»"),
    "z08": ("Yevrozabor «Qoya tosh»", "Euro fence «Rock»"),
    "z09": ("Yevrozabor «3D romblar»", "Euro fence «3D diamonds»"),
    "z10": ("Sharqona aylana zabor", "Oriental circle fence"),
    "f23": ("4 tali travertin", "Travertine, 4 pieces"),
    "f24": ("4 tali tosh", "Stone, 4 pieces"),
    "f25": ("6 tali tosh", "Stone, 6 pieces"),
    "f26": ("Korka 15×30", "Bark 15×30"),
}
for _i in range(1, 8):
    NAMES_3D[f"s0{_i}"] = (f"Skameyka oyog'i {_i}", f"Bench leg {_i}")

SUBTITLE_3D = {  # bo'lim -> (uz, ru, en) tavsif (termopanel varag'ida yo'q bo'limlar)
    "dekor": ("Dekor panel", "Декор-панель", "Decor panel"),
    "skameyka": (None, None, None),  # nomning o'zi "Skameyka oyog'i N" — takrorlanmasin
    "zabor": ("Zabor paneli", "Заборная панель", "Fence panel"),
    "fasad": ("Fasad plitkasi", "Фасадная плитка", "Facade tile"),
}

# Eski (3-varaq, 2026) fasad/dekor modellari bilan yarashtirish — docs/unresolved-questions.md.
# 1) Nomi + o'lchami 3D kodga aniq mos: shu kodga birlashadi (eski surat, vazn olinadi,
#    eski manzil 301 bilan yangisiga).
OLD_MERGE = {
    "labirint": "TP-012", "brilliant": "TP-009", "fasad-3d": "TP-008",
    "kirpich-fasad": "TP-007", "quba-fasad": "TP-004", "beeline-3": "BP-003",
}
# 2) 3D katalogda aniq jufti yo'q, lekin haqiqiy surati bor: saytda qoladi (bo'limi aniqlandi).
OLD_KEEP = {
    "rus-2-2": "fasad", "rus-2": "fasad", "rus-3": "fasad",
    "zina-30-120-gladkiy": "fasad_dekor", "sokol": "fasad_dekor", "kapitel-40-tepa": "fasad_dekor",
}
# 3) Qolganlari (suratsiz, o'lchami taxminiy, 3D katalogdagi oilalar bilan takrorlanadi) —
#    katalogdan chiqariladi, manzili bo'lim sahifasiga 301.


def ru_title(s: str) -> str:
    """'25Х50 БИЛАЙН' -> '25×50 Билайн', 'ЕВРОЗАБОР «ОКОВКА»' -> 'Еврозабор «Оковка»',
    '4 ТАЛИ КАМЕНЬ' -> '4 тали камень' (sanoq so'zi bosh harf olmaydi)."""
    s = re.sub(r"(\d)\s*[ХхXx]\s*(\d)", r"\1×\2", s.strip())
    words, capped = [], False
    tokens = s.split(" ")
    for i, w in enumerate(tokens):
        if re.search(r"\d", w) or w.upper() == "3D":
            words.append(w)
            capped = capped or w.upper() == "3D"
            continue
        low = w.lower()
        count_word = i == 1 and re.fullmatch(r"\d", tokens[0])
        if not capped and not count_word:
            low = ("«" + low[1:2].upper() + low[2:]) if low.startswith("«") else low[:1].upper() + low[1:]
        elif low.startswith("«"):
            low = "«" + low[1:2].upper() + low[2:]
        capped = True
        words.append(low)
    return " ".join(words)


SPEC_VALUE_I18N = {
    "Penoplast": ("Пенопласт", "Polystyrene foam"),
    "Penoplast yoki bazalt": ("Пенопласт или базальт", "Polystyrene foam or basalt"),
}


def en_from_uz(uz: str) -> str:
    """'25×50 Labirint' -> '25×50 Labyrinth', '15 Kapitel baza' -> '15 Capital base'."""
    out = []
    for w in uz.split(" "):
        out.append(EN_WORDS.get(w.lower(), w))
    return " ".join(out)


def split_size(size: str | None):
    """'88×220×15' -> ('88×220', '15'); '400×1200' -> ('400×1200', None)."""
    if not size:
        return None, None
    parts = size.split("×")
    if len(parts) >= 3:
        return "×".join(parts[:2]), parts[2]
    return size, None


def load_3d_sections(old_models: list[dict]):
    c3d = json.load(open(CATALOG3D))["items"]
    termo = json.load(open(TERMOPANEL))["items"]
    termo_by = {}
    for t in termo:
        termo_by[(t["code"].upper(), t["size"])] = t
        termo_by.setdefault((t["code"].upper(), None), t)
    old_by_slug = {m["slug"]: m for m in old_models}
    merged_into = {v: k for k, v in OLD_MERGE.items()}
    models, moved = [], []
    for r in c3d:
        if r["family"] == "trotuar":
            continue
        pid = r["id"]
        prefix = re.match(r"[a-z]+", pid).group(0)
        section = SECTION_OF_3D_PREFIX[prefix]
        code = r["label"].split("_")[0].upper()
        size, thick = split_size(r["size"])
        t = termo_by.get((code, size)) or termo_by.get((code, None))
        name_ru = ru_title(r["nameRu"])
        specs = []
        if t:
            slug = t["slug"]
            uz = t["name"]["uz"]
            en = en_from_uz(uz)
            sub_uz = t["subtitle"]["uz"]
            sub_ru, sub_en = SUBTITLE_I18N.get(sub_uz, (None, None))
            for sp in t["specs"]:
                sp = json.loads(json.dumps(sp))
                if sp["k"]["uz"].startswith("O'lcham"):
                    continue  # o'lcham qolip/plitka qatorida bor (3D o'lchami aniqroq, TP-011)
                if sp["v"]["uz"] in SPEC_VALUE_I18N and not sp["v"]["ru"]:
                    sp["v"]["ru"], sp["v"]["en"] = SPEC_VALUE_I18N[sp["v"]["uz"]]
                specs.append(sp)
            if t["size"] != size:
                q(f"`{code}` o'lchami: xlsx 6-varaqda {t['size']}, 3D modelda {size} — saytda 3D o'lchami. Tasdiqlang.")
        else:
            uz, en = NAMES_3D[pid]
            slug = f"{pid.replace('_', '-')}-{slugify(re.sub(r"[\'ʻʼ‘’]", '', uz))}"
            sub_uz, sub_ru, sub_en = SUBTITLE_3D[section]
        if thick:
            specs.append({"k": {"uz": "Qalinlik, mm", "ru": "Толщина, мм", "en": "Thickness, mm"},
                          "v": {"uz": thick, "ru": thick, "en": thick}})
        m = {
            "key": pid.replace("_", "-"),
            "code": code,
            "slug": slug,
            "section": section,
            "name": {"uz": uz, "ru": name_ru, "en": en},
            "subtitle": {"uz": sub_uz, "ru": sub_ru, "en": sub_en},
            "kg": None,
            "molds": [{"l": "A", "size": size, "depth": r["depth"], "g": None}],
            "tiles": [{"l": "A", "size": size, "per": None, "cap": None}],
            "specs": specs,
            "sizeEstimated": False,
            "images": {"scene": None, "sceneSm": None, "molds": {}, "tiles": {}},
            "_src": f"3D {pid}",
            "_name_norm": None,
            "_3d": r,
        }
        old_slug = merged_into.get(code)
        if old_slug and old_slug in old_by_slug:
            old = old_by_slug[old_slug]
            m["_name_norm"] = old["_name_norm"]  # 2026 studiya surati eski nom bilan topiladi
            m["kg"] = old["kg"]
            m["specs"] += [s for s in old["specs"] if s["k"]["uz"] not in {x["k"]["uz"] for x in m["specs"]}]
            if old["tiles"][0].get("per"):
                m["tiles"][0]["per"] = old["tiles"][0]["per"]
            moved.append({"from": [old["section"], old_slug], "to": [section, slug], "name": old["name"]["uz"]})
        models.append(m)
    kept = []
    for old in old_models:
        if old["slug"] in OLD_MERGE:
            continue
        if old["slug"] in OLD_KEEP:
            new_section = OLD_KEEP[old["slug"]]
            if new_section != old["section"]:
                moved.append({"from": [old["section"], old["slug"]], "to": [new_section, old["slug"]],
                              "name": old["name"]["uz"]})
                old["section"] = new_section
            kept.append(old)
            q(f"`{old['name']['uz']}` (eski 3-varaq) 3D katalogda aniq jufti topilmadi, lekin surati bor — "
              f"saytda `{new_section}` bo'limida qoldi. 3D katalogdagi qaysi kodga to'g'ri keladi (takror bo'lishi mumkin)?")
            continue
        moved.append({"from": [old["section"], old["slug"]], "to": [old["section"] if old["section"] != "dekor" else "fasad_dekor", None],
                      "name": old["name"]["uz"]})
    return models + kept, moved


def attach_renders(models, jobs, model3d):
    """Rasmi yo'q joyni 3D render bilan to'ldirish (tirik/studiya surati hamisha ustun).

    qolip_tik.jpg -> qolip (fonsiz, `npm run images:bg` niqobi), r_04 -> obyektdagi sahna.
    Render fayl nomi `-3d.webp` bilan tugaydi (`isRenderImage()`): sayt uni "3D vizualizatsiya"
    deb belgilaydi, alohida maydon kerak emas (brauzerga ketadigan katalog yengil qoladi).
    Tirik surat kelganda nom `-mold-a.webp` bo'ladi — belgi o'zi yo'qoladi.
    """
    stats = {"mold": 0, "scene": 0}
    for m in models:
        e = model3d.get(m["slug"])
        if not e:
            continue
        base = f"public/3d/{e['id']}"
        target = f"{m['section']}-{m['slug']}"
        if "A" not in m["images"]["molds"] and os.path.exists(os.path.join(ROOT, base, "qolip_tik.jpg")):
            dst = f"public/catalog/2027/{target}-mold-a-3d.webp"
            jobs.append({"src": f"{base}/qolip_tik.jpg", "dst": dst, "w": 800, "kind": "render"})
            m["images"]["molds"]["A"] = "/" + dst[len("public/"):]
            stats["mold"] += 1
        if not m["images"]["scene"]:
            src = next((f"{base}/{r}.jpg" for r in ("r_04", "r_05")
                        if os.path.exists(os.path.join(ROOT, base, f"{r}.jpg"))), None)
            if src:
                for suffix, w in (("scene", 1400), ("scene-sm", 720)):
                    jobs.append({"src": src, "dst": f"public/catalog/2027/{target}-{suffix}-3d.webp", "w": w, "kind": "render"})
                m["images"]["scene"] = f"/catalog/2027/{target}-scene-3d.webp"
                m["images"]["sceneSm"] = f"/catalog/2027/{target}-scene-sm-3d.webp"
                stats["scene"] += 1
    return stats


LIVE_KIND = {"qolip": "mold", "mold": "mold", "plitka": "tile", "tile": "tile",
             "sahna": "scene", "obyekt": "scene", "scene": "scene"}
LIVE_EXT = (".jpg", ".jpeg", ".png", ".webp")


def live_photos(models):
    """media-src/live/<KOD>[-qolip|-plitka|-sahna][-2].jpg — tirik suratlar (eng ustun manba).

    KOD — saytdagi model kodi (01, 70, TP-001, KRN-004-35, D05, Z03, S01, F23) yoki model slugi.
    Qoida va misollar: media-src/live/README.md.
    """
    if not os.path.isdir(LIVE_DIR):
        return {}
    by_key = {}
    for m in models:
        keys = {m["slug"].lower()}
        if m.get("code"):
            keys.add(m["code"].lower())
            keys.add(m["key"].lower())
        for k in keys:
            by_key.setdefault(k, m)
    found: dict[str, dict[str, str]] = {}
    unknown = []
    for f in sorted(os.listdir(LIVE_DIR)):
        stem, ext = os.path.splitext(f)
        if ext.lower() not in LIVE_EXT:
            continue
        s = stem.lower().replace(" ", "-").replace("_", "-")
        mm = re.match(r"^(.*?)(?:-(qolip|mold|plitka|tile|sahna|obyekt|scene))?(?:-(\d+))?$", s)
        code, kind, _n = mm.group(1), LIVE_KIND.get(mm.group(2) or "qolip"), mm.group(3)
        m = by_key.get(code)
        if not m:
            unknown.append(f)
            continue
        found.setdefault(m["slug"], {}).setdefault(kind, f"media-src/live/{f}")
    for f in unknown:
        q(f"Tirik surat `media-src/live/{f}` hech bir model kodiga mos kelmadi — fayl nomini tekshiring.")
    return found


def apply_live(models, jobs, live):
    n = 0
    for m in models:
        got = live.get(m["slug"])
        if not got:
            continue
        target = f"{m['section']}-{m['slug']}"
        if "mold" in got:
            dst = f"public/catalog/2027/{target}-mold-a.webp"
            jobs.append({"src": got["mold"], "dst": dst, "w": 800, "kind": "live"})
            m["images"]["molds"]["A"] = "/" + dst[len("public/"):]
        if "tile" in got:
            dst = f"public/catalog/2027/{target}-tile-a.webp"
            jobs.append({"src": got["tile"], "dst": dst, "w": 800, "kind": "live"})
            m["images"]["tiles"]["A"] = "/" + dst[len("public/"):]
        if "scene" in got:
            for suffix, w in (("scene", 1400), ("scene-sm", 720)):
                jobs.append({"src": got["scene"], "dst": f"public/catalog/2027/{target}-{suffix}.webp", "w": w, "kind": "live"})
            m["images"]["scene"] = f"/catalog/2027/{target}-scene.webp"
            m["images"]["sceneSm"] = f"/catalog/2027/{target}-scene-sm.webp"
        n += 1
    return n


def load_model3d_map():
    """Mavjud trotuar xaritasi (sayt slugi -> 3D id) — PR #42 dan, slug'lar o'zgarmaydi."""
    s = open(OUT_MODEL3D, encoding="utf-8").read()
    return json.loads(s[s.index("= {") + 2:s.rindex("}") + 1])


def write_model3d_map(model3d):
    body = json.dumps(model3d, ensure_ascii=False, indent=2)
    open(OUT_MODEL3D, "w", encoding="utf-8").write(
        "/** GENERATED: sayt model slugi -> 3D paket (public/3d/<id>). Qo'lda tahrirlamang.\n"
        " *  Trotuar xaritasi PR #42 dan saqlanadi, qolgan bo'limlar scripts/extract/build_models_2027.py\n"
        " *  (data/catalog3d-2027.json) dan qo'shiladi. */\n"
        "export const MODEL3D: Record<string, { id: string; have: string[]; poster: boolean }> = "
        + body + ";\n")


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
            for f in sorted(os.listdir(os.path.join(ROOT, "media-src/factory"))) if re.match(r"DSC\d", f)}
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
    return jobs, stats


def main():
    other, moved = load_3d_sections(load_other_sections())
    models = load_trotuar() + other
    for i, m in enumerate(models):
        if m["code"] in POPULARITY:
            m["_pop"] = POPULARITY.index(m["code"])
        else:
            m["_pop"] = 1000 + i
    models.sort(key=lambda m: (m["_pop"], m["slug"]))
    jobs, stats = load_image_sources(models)
    live = live_photos(models)
    live_jobs: list = []
    stats["live"] = apply_live(models, live_jobs, live)
    live_dst = {j["dst"] for j in live_jobs}
    jobs = [j for j in jobs if j["dst"] not in live_dst] + live_jobs

    model3d = load_model3d_map()
    for m in models:
        r = m.get("_3d")
        if r:
            have = [k for k in ("qolip", "mahsulot", "terilgan") if k in r["glb"]]
            if have:
                model3d[m["slug"]] = {"id": r["id"], "have": have, "poster": False}
    stats["render"] = attach_renders(models, jobs, model3d)
    for m in models:
        im = m["images"]
        if not (im["scene"] or im["molds"] or im["tiles"]):
            q(f"`{m['name']['uz']}` ({m['section']}) uchun rasm yo'q: na surat, na 3D render. "
              "Sayt `noindex` qiladi va WhatsApp orqali surat so'rashni taklif qiladi.")
    write_model3d_map(dict(sorted(model3d.items())))
    json.dump({"$comment": "GENERATED — scripts/extract/build_models_2027.py. Ko'chirilgan/chiqarilgan "
               "eski modellar (build_redirects_2027.py 301 yasaydi). to[1] = null -> bo'lim sahifasiga.",
               "moved": moved}, open(OUT_MOVED, "w"), ensure_ascii=False, indent=1)
    for m in models:
        m.pop("_3d", None)
        m.pop("_name_norm", None)
        m.pop("_src", None)
        m.pop("_pop", None)
    payload = {
        "$comment": "GENERATED — scripts/extract/build_models_2027.py. Qo'lda tahrirlanmasin!",
        "version": "2027-0",
        "generatedAt": "2026-11-12",
        "source": "docs/design-handoff/data-sources/*.xlsx + src/data/catalog.json (rasmlar)",
        "sections": ["trotuar", "termopanel", "fasad", "fasad_dekor", "zabor", "dekor", "skameyka"],
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
        "> Har bir savol manba fayl va katakka ishora qiladi. Javob kelgacha qiymat `null`; saytda neytral matn chiqadi (`[...]` hech qachon ko'rsatilmaydi).",
        "",
        f"Jami model: **{len(models)}** (HANDOFF dastlabki rejasi: 152; 3D katalog bilan to\'ldirildi). Bo'limlar: "
        + ", ".join(f"{k} {v}" for k, v in counts.items()),
        "",
        "## Manbalar holati",
        "",
        "- Mahsulot ro'yxati, ruscha nomlar, aniq o'lcham va qolip chuqurligi — 3D paketlar (`public/3d`, `data/catalog3d-2027.json`).",
        "- Suratlar: tirik suratlar (`media-src/live/`, eng ustun) → 2026 studiya → 5-varaq DSC → 3D render (fayl nomi `-3d.webp`, saytda \"3D vizualizatsiya\" belgisi).",
        "- Hali yo'q: uch tilli 2027 PDF katalog (uz/en nomlarning rasmiy varianti, sahifa matnlari).",
        "",
        "## Savollar",
        "",
    ]
    lines += [f"{i}. {t}" for i, t in enumerate(QUESTIONS + MANUAL_QUESTIONS, 1)]
    open(OUT_QUESTIONS, "w").write("\n".join(lines) + "\n")
    print(f"models={len(models)} sections={counts} images={stats} questions={len(QUESTIONS)} jobs={len(jobs)}")


if __name__ == "__main__":
    main()
