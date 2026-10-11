#!/usr/bin/env python3
"""
Bosqich 5 — migratsiya xaritasi: eski (2026) URL'lar → yangi (2027) marshrutlar.

Chiqish: `scripts/redirects-2027.json` (next.config.js shu faylni o'qiydi).
Manba: `docs/legacy/catalog-2026.json` (eski 192 mahsulot + 3 kategoriya + blog/loyihalar)
va `data/models-2027.json` (yangi 119 model).

Moslash qoidasi: eski mahsulot nomi (uz) yangi model nomiga mos kelsa — aniq
model sahifasiga 301; mos kelmasa — bo'lim/katalog sahifasiga. HANDOFF 7:
"Eski URL'lar → katalog yoki yangi sahifalarga 301; topilmaganlari 404".
"""
import json
import os
import re
import unicodedata

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OLD = os.path.join(ROOT, "docs/legacy/catalog-2026.json")
NEW = os.path.join(ROOT, "data/models-2027.json")
OUT = os.path.join(ROOT, "scripts/redirects-2027.json")

LOCALES = ["uz", "ru"]
LANG_FALLBACK = {"uz": "uz", "ru": "ru"}

SECTION_BY_OLD_CATEGORY = {
    "cat-s1": "paving",   # Bruschatka va trotuar plitkasi qoliplari
    "cat-s2": "paving",   # Dekorativ plitka qoliplari (trotuar assortimenti)
    "cat-s3": "facade",   # Panel va profil (fasad) qoliplari
}

STOP_WORDS = {
    "qolip", "qolipi", "qoliplar", "qoliplari", "forma", "formy", "form",
    "plastik", "plastikovye", "plastikovyy", "uchun", "dlya", "bruschatka",
    "bruschatki", "trotuar", "trotuarnoy", "plitka", "plitkasi", "plitki",
    "tlitki", "beton", "betona", "betonnoy", "spс", "sps", "va", "i",
}


def norm(name: str) -> str:
    s = unicodedata.normalize("NFKD", str(name or "")).lower()
    s = s.replace("‘", "").replace("’", "").replace("`", "")
    s = re.sub(r"[«»\"'()\-–—.,/·:;!?]", " ", s)
    s = re.sub(r"[^a-z0-9а-яё ]+", " ", s)
    words = [w for w in re.split(r"\s+", s) if w and w not in STOP_WORDS]
    return " ".join(words).strip()


def main() -> None:
    old = json.load(open(OLD, encoding="utf-8"))
    new = json.load(open(NEW, encoding="utf-8"))["models"]

    # Yangi modellarni normallashtirilgan nom bo'yicha indekslaymiz.
    index: dict[str, dict] = {}
    for m in new:
        for lang in ("uz", "ru", "en"):
            key = norm(m["name"].get(lang) or "")
            if key and key not in index:
                index[key] = m
        # Kod bo'yicha ham (eski SKU'da raqam bo'lsa)
        if m.get("code"):
            index.setdefault("#" + str(m["code"]).lower(), m)

    redirects = []
    stats = {"products": 0, "matched": 0, "categories": 0, "static": 0, "legacy": 0}

    def section_path(m: dict | None, lang: str, category_id: str | None = None) -> str:
        if m:
            slug = {"trotuar": "paving", "fasad": "facade", "zabor": "fence",
                    "dekor": "decor", "skameyka": "bench"}[m["section"]]
            return f"/{lang}/catalog/{slug}/{m['slug']}"
        # Mos model topilmasa — eski kategoriyaning yangi bo'limiga
        fallback = SECTION_BY_OLD_CATEGORY.get(category_id or "")
        return f"/{lang}/catalog/{fallback}" if fallback else f"/{lang}/catalog"

    # 1) Eski mahsulotlar
    for p in old.get("products", []):
        for tr in p.get("translations", []):
            lang = tr.get("locale")
            slug = tr.get("slug")
            if lang not in LOCALES or not slug:
                continue
            uz_name = ""
            for t2 in p.get("translations", []):
                if t2.get("locale") == "uz":
                    uz_name = t2.get("name") or ""
            match = index.get(norm(tr.get("name") or "")) or index.get(norm(uz_name))
            if not match and uz_name:
                # «Floriya» qolipi → "floriya" bo'yicha qismiy moslik
                key = norm(uz_name)
                for k, v in index.items():
                    if k and not k.startswith("#") and (k in key or key in k):
                        match = v
                        break
            stats["products"] += 1
            if match:
                stats["matched"] += 1
            redirects.append({
                "source": f"/{lang}/product/{slug}",
                "destination": section_path(match, LANG_FALLBACK[lang], p.get("categoryId")),
                "statusCode": 301,
            })

    # 2) Eski kategoriyalar (uz va ru slug'lari)
    for c in old.get("categories", []):
        dest_section = SECTION_BY_OLD_CATEGORY.get(c.get("id"))
        for tr in c.get("translations", []):
            lang, slug = tr.get("locale"), tr.get("slug")
            if lang not in LOCALES or not slug:
                continue
            stats["categories"] += 1
            redirects.append({
                "source": f"/{lang}/catalog/{slug}",
                "destination": f"/{lang}/catalog/{dest_section}" if dest_section else f"/{lang}/catalog",
                "statusCode": 301,
            })

    # 3) Eski statik sahifalar (yangi saytda yo'q)
    static_map = {
        "/about": "/production",
        "/blog": "",
        "/projects": "",
        "/delivery-payment": "/partners",
        "/how-to-order": "/request",
        "/returns": "/partners",
        "/terms": "/privacy",
        "/wishlist": "/request",
        "/search": "/catalog",
    }
    for lang in LOCALES:
        for src, dst in static_map.items():
            stats["static"] += 1
            redirects.append({
                "source": f"/{lang}{src}",
                "destination": f"/{lang}{dst}",
                "statusCode": 301,
            })
            # Ichki sahifalar (blog/:slug, projects/:slug) ham
            if src in ("/blog", "/projects"):
                redirects.append({
                    "source": f"/{lang}{src}/:slug",
                    "destination": f"/{lang}{dst}",
                    "statusCode": 301,
                })
        # Til prefikssiz eski manzillar (indeksda qolgan bo'lishi mumkin)
        redirects.append({"source": f"/{lang}/product/:slug", "destination": f"/{lang}/catalog", "statusCode": 301})

    # 4) 2017-yilgi CMS manzillari (eski next.config ro'yxati, yangi manzillar bilan)
    legacy = [
        ("/about", "/ru/production"),
        ("/produkciya", "/ru/catalog"),
        ("/formi", "/ru/catalog"),
        ("/formi/p/:page*", "/ru/catalog"),
        ("/formi/image/:id*", "/ru/catalog"),
        ("/plitki", "/ru/catalog"),
        ("/kolodtsy", "/ru/catalog"),
        ("/bordyury-i-lotki", "/ru/catalog"),
        ("/uslugi", "/ru/production"),
        ("/proizvoditeli", "/ru/production"),
        ("/doc", "/ru/partners"),
        ("/otzyvy-o-nas", "/ru/production"),
        ("/fotogalereya", "/ru"),
        ("/novosti", "/ru"),
        ("/novosti/news_post/:slug*", "/ru"),
        ("/napishite-nam", "/ru/contact"),
        ("/kontakty", "/ru/contact"),
        ("/search", "/ru/catalog"),
        ("/karta-sayta", "/ru"),
        ("/user", "/ru"),
        # Til prefikssiz eski mahsulot/katalog havolalari
        ("/product/:slug", "/uz/catalog"),
        ("/catalog/:slug", "/uz/catalog"),
    ]
    for src, dst in legacy:
        stats["legacy"] += 1
        redirects.append({"source": src, "destination": dst, "statusCode": 301})

    # www → apex (next.config da host sharti bilan, bu yerda saqlanmaydi)
    json.dump(
        {"$comment": "GENERATED — scripts/extract/build_redirects_2027.py. Eski URL → yangi marshrut (301).",
         "redirects": redirects},
        open(OUT, "w", encoding="utf-8"),
        ensure_ascii=False,
        indent=1,
    )
    print(f"redirects={len(redirects)} products={stats['products']} matched={stats['matched']} "
          f"categories={stats['categories']} static={stats['static']} legacy={stats['legacy']}")


if __name__ == "__main__":
    main()
