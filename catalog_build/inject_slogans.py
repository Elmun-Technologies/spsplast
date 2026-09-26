#!/usr/bin/env python3
"""Add slogan + headline fields to products.json (in place, idempotent)."""
import json

CUSTOM = {
    "G001": ("Egri chiziqlar. Ikki xil tekstura.", "NAQSH MAKONGA AYLANADI."),
    "G002": ("Markazga yo‘nalgan geometriya.", "GEOMETRIYA HARAKATDA."),
    "G003": ("Bezakli hoshiya. Sokin markaz.", "KLASSIKA — HAR PLITADA."),
    "G004": ("Shakl va chiziq o‘yini.", "HAR BIR CHIZIQDA XARAKTER."),
    "G005": ("Silliq yo‘l — silliq ritm.", "RITM BUTUN MAKONDA."),
    "G006": ("Tartib va ritm bitta formada.", "MAKONDA TARTIB VA RITM."),
    "G007": ("Kuchli forma. Xotirlam qoladigan natija.", "NAKSH — QALBDA QOLADI."),
    "G008": ("Toshteki jasorat.", "ME‘MORIY RITM."),
    "G009": ("Romblar mustahkam tartibda.", "DIAGONAL — HARAKATDA."),
    "G010": ("Gul naqshi — nozik va chiroyli.", "GUL — HAR PLITADA."),
    "G011": ("Shahar ruhini betonga olib.", "SHAHAR RUHI — BETONDA."),
    "G012": ("Osmon shu tugun nuqtasi.", "YULDUZ — HAR MAKONDA."),
    "G013": ("Turkman naqshi — asrlar merosi.", "MEROS — GULNING NAQSHIDA."),
    "G014": ("Yagona forma. Yagona natija.", "TAKRORLANMAS SHAKL."),
    "G015": ("Keng maydonlar uchun jasur tanlov.", "JASUR SHAKL — KATTA MAKON."),
    "G016": ("Sharq naqshining nozik oqimi.", "MEROS — HAR PLITADA."),
    "G017": ("Dono naqsh — chuqur mukammallik.", "DONOLIK — HAR DETALDA."),
    "G018": ("Shohona chiziq. Shohona natija.", "SHON — HAR KO‘CHADA."),
    "G019": ("Issiq iqlim arafasida.", "TROPIK RITM."),
    "G020": ("Harakat — qaytgan shaklda.", "HARAKAT — QAYTGAN SHAKLDA."),
    "G021": ("Ko‘chada Dubay me‘moriyasi.", "DUBAY — TOSH QUDRATIDA."),
    "G022": ("Ko‘chada Dubay me‘moriyasi.", "DUBAY — ZAMONAVIY NAQSHDA."),
    "G023": ("Ko‘chada Dubay me‘moriyasi.", "DUBAY — AYLANA RITMIDA."),
    "G024": ("Shaklda erkin oqim.", "PARUS — OLDINGA HARAKATDA."),
    "G025": ("Karnaval ritmi betonda.", "RITM — HAR PLITADA."),
    "G028": ("Yorug'lik bo‘laklari formula.", "YORUQ — HAR BURCHAKDA."),
}

RULES = [
    (["gul", "guli"], "Gul — har plitada.", "GUL — HAR PLITADA."),
    (["yulduz"], "Osmon naqshi plitada.", "YULDUZ — HAR MAKONDA."),
    (["romb", "diagon"], "Diagonal ritm — cheksiz davomiylik.", "DIAGONAL — HARAKATDA."),
    (["qirrali", "qirrali", "qirra", "kvadrat", "katak"], "Aniq qirralar. Toza chiziqlar.", "QIRRA — ANIQ VA SOBIT."),
    (["tosh", "toshi"], "Tosh go‘yoki yangi sodir bo‘lmoqda.", "TOSH QUDRATI."),
    (["g‘isht", "g’isht"], "Klassik shahar uslubi.", "KLASSIKA — HAR MAKONDA."),
    (["panel", "sirt"], "Keng sirt. Katta forma.", "SIRTGA YANGI QIYOFA."),
    (["profil", "ramka", "hoshiya"], "Chiziq kosib bergan shakl.", "CHIZIQ — RUHDAGI TARTIB."),
    (["medalyon", "naqsh"], "Hayotiy naqsh — hayotda qoladigan.", "NAQSH — XOTIRDA QOLADI."),
    (["tekstura", "relief", "relyef"], "Tekstura — naqshning tili.", "TEKSTURA — NAQSHNING TILI."),
    (["geometr", "to‘lqin", "aylan", "oval", "chuqu"], "Geometriya — aniq ritm.", "GEOMETRIYA — ANIQ RITM."),
]

S3_DEFAULT = ("Makon uchun zamonaviy g‘oya.", "DEVORGA YANGI QIYOFA.")
FALLBACK = ("Shakl. Naqsh. Natija.", "SHAKL MAKONDA.")

def fill(d):
    for p in d:
        if p["code"] in CUSTOM:
            p["slogan"], p["headline"] = CUSTOM[p["code"]]
            continue
        nm = p["name"].lower().replace("’", "‘")
        hit = None
        for keys, s, h in RULES:
            for k in keys:
                if k.replace("’", "‘") in nm:
                    hit = (s, h)
                    break
            if hit:
                break
        if hit is None:
            hit = S3_DEFAULT if p["section"] == "S3" else FALLBACK
        p["slogan"], p["headline"] = hit

d = json.load(open("products.json", encoding="utf-8"))
fill(d)
json.dump(d, open("products.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for c in ("G001", "G013", "G030", "G026", "G027", "A10-001", "A10-034"):
    p = next(x for x in d if x["code"] == c)
    print(c, "|", p["name"], "|", p["slogan"], "|", p["headline"])
print("done", sum(1 for p in d if p.get("slogan")), "of", len(d))
