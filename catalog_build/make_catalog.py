# -*- coding: utf-8 -*-
"""
SPS — Qoliplar Katalogi 2026
To'liq PDF katalog generatori (reportlab).
Ma'lumotlar: catalog_build/products.json + images/
"""
import json, os
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader

ROOT = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(ROOT, "images")
PRODUCTS = json.load(open(os.path.join(ROOT, "products.json"), encoding="utf-8"))

W, H = 595.28, 841.89  # A4 portrait (pt)
MARGIN = 36

DARK   = HexColor("#161616")
INK    = HexColor("#232323")
RED    = HexColor("#D8232A")
GRAY   = HexColor("#8B8B8B")
LGRAY  = HexColor("#BCBCBC")
BORDER = HexColor("#E4E1DB")
BGCARD = HexColor("#FFFFFF")
BGWARM = HexColor("#F7F4EF")
WHITE  = HexColor("#FFFFFF")

# ---------- fonts ----------
FD = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DV",  f"{FD}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", f"{FD}/DejaVuSans-Bold.ttf"))

def sw(t, f, s): return pdfmetrics.stringWidth(t, f, s)

def wrap(text, font, size, maxw):
    words, lines, cur = text.split(), [], ""
    for w_ in words:
        t = (cur + " " + w_).strip()
        if sw(t, font, size) <= maxw:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w_
    if cur: lines.append(cur)
    return lines

def text(c, x, y, s, font="DV", size=9, color=INK, track=0):
    c.setFont(font, size); c.setFillColor(color)
    if track:
        c.drawString(x, y, s, charSpace=track)
    else:
        c.drawString(x, y, s)

def rtext(c, x, y, s, font="DV", size=9, color=INK, track=0):
    text(c, x - sw(s, font, size) - track*len(s), y, s, font, size, color, track)

def ctext(c, cx, y, s, font="DV", size=9, color=INK, track=0):
    text(c, cx - (sw(s, font, size) + track*len(s))/2, y, s, font, size, color, track)

def chip(c, x, y, s, font="DVB", size=7, bg=RED, fg=WHITE, pad_x=5, h=13, radius=2.2):
    wch = sw(s, font, size) + 2*pad_x
    c.setFillColor(bg)
    c.roundRect(x, y, wch, h, radius, stroke=0, fill=1)
    text(c, x + pad_x, y + (h - size*0.72)/2 + size*0.72 - size*0.28 - 1.6, s, font, size, fg)
    return wch

def draw_img_cover(c, path, x, y, w, h):
    """draw image covering box (image already pre-cropped to ~aspect)"""
    c.drawImage(path, x, y, w, h, preserveAspectRatio=False, mask=None)

def draw_img_contain(c, path, x, y, w, h, bg=WHITE):
    c.setFillColor(bg); c.rect(x, y, w, h, stroke=0, fill=1)
    im = Image.open(path); iw, ih = im.size
    sc = min(w/iw, h/ih)
    dw, dh = iw*sc, ih*sc
    c.drawImage(path, x + (w-dw)/2, y + (h-dh)/2, dw, dh, mask=None)

CONTACTS = {
    "phone": "+998 (98) 300-77-72",
    "web": "www.sps.uz",
    "email": "stoneprofyservise@mail.ru",
    "addr": "Toshkent, O‘zbekiston",
}

SECTIONS = {
    "S1": dict(no="01", title="BRUSCHATKA VA TROTUAR", title2="QO‘LIPLARI",
               rng="G001 – G029", desc="Bruschatka va trotuar plitkasi uchun plastik qoliplar",
               div="div1.jpg"),
    "S2": dict(no="02", title="DEKORATIV PLITA", title2="QO‘LIPLARI",
               rng="G030 – G103", desc="Dekorativ va relyefli plitalar uchun qoliplar",
               div="div2.jpg"),
    "S3": dict(no="03", title="PANEL VA PROFIL", title2="QO‘LIPLARI",
               rng="A10-001 … A10-036", desc="Devor paneli va profil (hoshiya) qoliplari",
               div="div3.jpg"),
}

# ---------- page frame ----------
def footer(c, pageno):
    c.setStrokeColor(BORDER); c.setLineWidth(0.6)
    c.line(MARGIN, 34, W - MARGIN, 34)
    text(c, MARGIN, 23, f"{CONTACTS['phone']}  ·  {CONTACTS['email']}", "DV", 7, GRAY)
    rtext(c, W - MARGIN, 23, f"SPS · QO‘LIPLAR KATALOGI 2026  ·  SAHIFA {pageno}", "DV", 7, GRAY)

def header(c, section_key=None, label=None):
    y = H - 40
    c.setFillColor(RED); c.rect(MARGIN, y - 2.2, 16, 2.4, stroke=0, fill=1)
    lab = label or (SECTIONS[section_key]["desc"] if section_key else "")
    text(c, MARGIN + 22, y - 5, lab.upper(), "DVB", 8, HexColor("#6E6E6E"))
    logo = os.path.join(IMG, "logo_dark.jpg")
    lw = 52
    im = Image.open(logo); ar = im.height / im.width
    c.drawImage(logo, W - MARGIN - lw, y - 8, lw, lw*ar)
    text(c, W - MARGIN - lw, y - 17, CONTACTS["web"], "DV", 6.6, GRAY)
    c.setStrokeColor(BORDER); c.setLineWidth(0.6)
    c.line(MARGIN, y - 24, W - MARGIN, y - 24)

# ---------- cover ----------
def cover(c):
    top_h = 545
    draw_img_cover(c, os.path.join(IMG, "cover_top.jpg"), 0, H - top_h, W, top_h)
    # dark band
    c.setFillColor(DARK); c.rect(0, 0, W, H - top_h, stroke=0, fill=1)
    c.setFillColor(RED); c.rect(0, H - top_h, W, 4, stroke=0, fill=1)
    # logo white
    lg = os.path.join(IMG, "logo_white.png")
    im = Image.open(lg); lw = 120
    c.drawImage(lg, MARGIN, H - top_h - 66, lw, lw*im.height/im.width, mask="auto")
    text(c, MARGIN, H - top_h - 96, "Q O‘L I P L A R   K A T A L O G I", "DVB", 26, WHITE, track=1.5)
    c.setFillColor(RED); c.rect(MARGIN, H - top_h - 112, 54, 3, stroke=0, fill=1)
    text(c, MARGIN, H - top_h - 134, "BRUSCHATKA  ·  DEKORATIV PLITA  ·  PANEL VA PROFIL", "DV", 8.6, HexColor("#CFCFCF"), track=0.4)
    text(c, MARGIN, H - top_h - 152, "130 ta model — asl qolip va quyma natijasi bilan", "DV", 9.4, HexColor("#9A9A9A"))
    rtext(c, W - MARGIN, H - top_h - 152, "2026", "DVB", 26, HexColor("#4A4A4A"))
    rtext(c, W - MARGIN, H - top_h - 164, "nashri", "DV", 8, HexColor("#8A8A8A"))
    # contacts bottom
    y = 52
    c.setStrokeColor(HexColor("#333333")); c.setLineWidth(0.7)
    c.line(MARGIN, y + 22, W - MARGIN, y + 22)
    text(c, MARGIN, y, CONTACTS["phone"], "DVB", 10.5, WHITE)
    text(c, MARGIN + 150, y, CONTACTS["email"], "DV", 9, HexColor("#CFCFCF"))
    rtext(c, W - MARGIN, y, CONTACTS["web"], "DVB", 10.5, WHITE)

# ---------- info page ----------
def info_page(c, pageno):
    header(c, label="Katalog haqida")
    footer(c, pageno)
    y = H - 96
    text(c, MARGIN, y, "SPS — STONE PROFY SERVISE", "DVB", 8.6, RED, track=0.6)
    y -= 26
    text(c, MARGIN, y, "BETON QOLIPLARI —", "DVB", 19, DARK)
    y -= 21
    text(c, MARGIN, y, "TANLANG, QUYING, NATIJA OLING.", "DVB", 19, DARK)
    y -= 20
    intro = ("SPS — Toshkent shahrida joylashgan ishlab chiqaruvchi. Biz beton va gips quyish uchun "
             "plastik qoliplar tayyorlaymiz: bruschatka va trotuar plitkalari, dekorativ relyefli plitalar, "
             "devor panellari va profillar. Katalogdagi har bir model ikki ko‘rinishda berilgan — "
             "qolipning o‘zi va undan olingan tayyor quyma.")
    for ln in wrap(intro, "DV", 9.6, W - 2*MARGIN):
        y -= 14; text(c, MARGIN, y, ln, "DV", 9.6, HexColor("#4A4A4A"))
    y -= 30

    # three thumbs
    bw = (W - 2*MARGIN - 2*12) / 3
    thumbs = [("info_mold.jpg", "01 — QO‘LIP", "Asl plastik qolip"),
              ("info_quyma.jpg", "02 — QUYMA", "Qolipdan olingan plita"),
              ("info_env.jpg", "03 — QO‘LLANISH", "Makon jihatdan g‘oya")]
    for i, (f, t1, t2) in enumerate(thumbs):
        x = MARGIN + i*(bw + 12)
        c.setFillColor(BGCARD); c.setStrokeColor(BORDER); c.setLineWidth(0.7)
        c.roundRect(x, y - bw - 44, bw, bw + 44, 4, stroke=1, fill=1)
        draw_img_cover(c, os.path.join(IMG, f), x + 6, y - bw - 8, bw - 12, bw - 14)
        ctext(c, x + bw/2, y - bw - 24, t1, "DVB", 7, RED)
        ctext(c, x + bw/2, y - bw - 35, t2, "DV", 6.8, GRAY)
    y = y - bw - 44 - 34

    # facts
    text(c, MARGIN, y, "ASOSIY MA‘LUMOTLAR", "DVB", 9, DARK); y -= 6
    c.setFillColor(RED); c.rect(MARGIN, y - 2.2, 16, 2.2, stroke=0, fill=1)
    y -= 18
    facts = [
        ("Material", "Polipropilen / ABS — aniq geometriya va uzoq xizmat uchun qattiqlashtirilgan plastik."),
        ("O‘lchamlar", "Barcha o‘lchamlar millimetrda (mm): uzunlik × kenglik × balandlik."),
        ("Komplektlar", "A / B / V belgili modellar bir nechta elementdan iborat to‘plam."),
        ("* izoh", "Yulduzcha (*) bilan belgilangan o‘lchamlar standart qiymat — aniq ko‘rsatkich "
                   "buyurtma paytida menejer bilan tasdiqlanadi."),
        ("Narx", "Narxlash hajm va komplektga bog‘liq — joriy narxni menejerdan so‘rang."),
    ]
    for t, d in facts:
        c.setFillColor(RED); c.circle(MARGIN + 3, y + 3, 1.6, stroke=0, fill=1)
        text(c, MARGIN + 12, y, t, "DVB", 8.8, INK)
        xoff = 12 + sw(t + "  ", "DVB", 8.8)
        for j, ln in enumerate(wrap(d, "DV", 8.8, W - 2*MARGIN - xoff)):
            text(c, MARGIN + (xoff if j == 0 else 12), y, ("— " if j == 0 else "") + ln if j == 0 else ln, "DV", 8.8,
                 HexColor("#4A4A4A"))
            y -= 12.6
        y -= 3.5

    y -= 12
    text(c, MARGIN, y, "QANDAY BUYURTMA BERISH KERAK?", "DVB", 9, DARK); y -= 6
    c.setFillColor(RED); c.rect(MARGIN, y - 2.2, 16, 2.2, stroke=0, fill=1)
    y -= 8
    steps = [
        ("1", "Qolipni tanlang", "Mahsulot kodini yozib oling (masalan, G001 yoki A10-003)."),
        ("2", "Menejer bilan bog‘laning", "O‘lcham, miqdor, mavjudlik va narxni aniqlashtiring."),
        ("3", "Buyurtmani tasdiqlang", "Ishlab chiqarish jadvali va yetkazib berish kelishiladi."),
    ]
    sh = 52
    for i, (n, t, d) in enumerate(steps):
        y -= sh + 8
        x = MARGIN
        c.setFillColor(BGWARM); c.setStrokeColor(BORDER); c.setLineWidth(0.7)
        c.roundRect(x, y, W - 2*MARGIN, sh, 4, stroke=1, fill=1)
        c.setFillColor(RED); c.circle(x + 30, y + sh/2, 13, stroke=0, fill=1)
        ctext(c, x + 30, y + sh/2 - 4.4, n, "DVB", 13, WHITE)
        text(c, x + 54, y + sh - 20, t, "DVB", 10, DARK)
        text(c, x + 54, y + 12, d, "DV", 8.2, HexColor("#4A4A4A"))
    # contact strip anchored above footer
    sy = 44
    c.setFillColor(DARK)
    c.roundRect(MARGIN, sy, W - 2*MARGIN, 38, 4, stroke=0, fill=1)
    text(c, MARGIN + 14, sy + 14, CONTACTS["phone"], "DVB", 11, WHITE)
    ctext(c, W/2 + 8, sy + 15, "Telegram / WhatsApp mavjud", "DV", 8.4, HexColor("#CFCFCF"))
    rtext(c, W - MARGIN - 14, sy + 14, "www.sps.uz", "DVB", 10.5, WHITE)

# ---------- TOC ----------
def toc_page(c, pageno, sec_pages):
    header(c, label="Mundarija")
    footer(c, pageno)
    y = H - 100
    text(c, MARGIN, y, "MUNDARIJA", "DVB", 22, DARK)
    rtext(c, W - MARGIN, y, "130 ta model", "DV", 9.5, GRAY)
    y -= 14
    c.setFillColor(RED); c.rect(MARGIN, y, 54, 3, stroke=0, fill=1)
    y -= 44
    counts = {"S1": 29, "S2": 74, "S3": 27}
    desc2 = {
        "S1": "Hovli, yo‘lak va maydonlar uchun bruschatka hamda trotuar plitkasi qoliplari.",
        "S2": "Relyefli, geometrik va naqshli dekorativ plitalar uchun qoliplar.",
        "S3": "Devor va to‘siq panellari, profil-hoshiyalar uchun qoliplar.",
    }
    rh = 128
    for key in ("S1", "S2", "S3"):
        s = SECTIONS[key]
        y -= rh + 24
        c.setFillColor(BGCARD); c.setStrokeColor(BORDER); c.setLineWidth(0.8)
        c.roundRect(MARGIN, y, W - 2*MARGIN, rh, 5, stroke=1, fill=1)
        c.setFillColor(RED); c.rect(MARGIN, y, 4, rh, stroke=0, fill=1)
        x = MARGIN + 18
        text(c, x, y + rh - 28, s["no"], "DVB", 17, RED)
        text(c, x + 34, y + rh - 28, s["title"] + " " + s["title2"], "DVB", 12.5, DARK)
        text(c, x + 34, y + rh - 46, s["rng"] + f"   ·   {counts[key]} ta model   ·   sahifa {sec_pages[key]}", "DVB", 8.8, HexColor("#6E6E6E"))
        yy = y + rh - 62
        for ln in wrap(desc2[key], "DV", 8.4, W - 2*MARGIN - 18 - 130)[:2]:
            text(c, x + 34, yy, ln, "DV", 8.4, HexColor("#6E6E6E"))
            yy -= 11.5
        # thumb
        th = rh - 26
        draw_img_cover(c, os.path.join(IMG, s["div"]), W - MARGIN - 14 - th, y + 13, th, th)
    # bottom note box anchored above footer
    note = ("Har bir mahsulot kartochkasida: mahsulot kodi, nomi, o‘lchami (mm), material hamda ikki rasm — "
            "qolip va quyma natijasi ko‘rsatiladi. Yulduzcha (*) — standart o‘lcham, buyurtmada aniq tasdiqlanadi.")
    lines = wrap(note, "DV", 8.6, W - 2*MARGIN - 24)
    bh = 20 + 13*len(lines) + 8
    by = 52
    c.setFillColor(BGWARM); c.setStrokeColor(BORDER); c.setLineWidth(0.7)
    c.roundRect(MARGIN, by, W - 2*MARGIN, bh, 4, stroke=1, fill=1)
    c.setFillColor(RED); c.rect(MARGIN, by, 4, bh, stroke=0, fill=1)
    yy = by + bh - 18
    text(c, MARGIN + 14, yy, "ESLATMA", "DVB", 7.5, RED, track=0.8)
    for ln in lines:
        yy -= 13; text(c, MARGIN + 14, yy, ln, "DV", 8.6, HexColor("#4A4A4A"))

# ---------- divider ----------
def divider(c, key, pageno):
    s = SECTIONS[key]
    draw_img_cover(c, os.path.join(IMG, s["div"]), 0, 0, W, H)
    # top mark with backdrop
    tt = "SPS / QO‘LIPLAR KATALOGI 2026"
    tw = sw(tt, "DVB", 7.5) + 0.8*len(tt) + 12
    c.setFillColor(Color(0.05, 0.05, 0.05, alpha=0.62))
    c.roundRect(MARGIN - 6, H - 50, tw, 16, 3, stroke=0, fill=1)
    text(c, MARGIN, H - 45.5, tt, "DVB", 7.5, WHITE, track=0.8)
    # bottom dark panel
    c.setFillColor(Color(0.05, 0.05, 0.05, alpha=0.72))
    c.rect(0, 0, W, 250, stroke=0, fill=1)
    c.setFillColor(RED); c.rect(0, 250, W, 3, stroke=0, fill=1)
    y = 196
    text(c, MARGIN, y, "BO‘LIM " + s["no"], "DVB", 9.5, RED, track=1.2)
    y -= 34
    text(c, MARGIN, y, s["title"], "DVB", 27, WHITE)
    y -= 30
    text(c, MARGIN, y, s["title2"], "DVB", 27, WHITE)
    y -= 26
    text(c, MARGIN, y, s["desc"] + "   ·   " + s["rng"], "DV", 9.5, HexColor("#D8D8D8"))
    y -= 20
    cnt = {"S1": "29 ta model", "S2": "74 ta model", "S3": "27 ta model"}[key]
    text(c, MARGIN, y, cnt, "DVB", 9.5, WHITE)
    text(c, MARGIN, 22, f"SAHIFA {pageno}", "DV", 7, HexColor("#BFBFBF"))

# ---------- product card ----------
def product_card(c, p, x, y, w, h):
    c.setFillColor(BGCARD); c.setStrokeColor(BORDER); c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 4, stroke=1, fill=1)
    c.setFillColor(RED); c.rect(x, y + h - 2.4, w, 2.4, stroke=0, fill=1)

    pad = 9
    top = y + h - pad
    boxw = (w - 2*pad - 8) / 2
    # fixed chain under images: labels(9.5) + name2lines(27.8) + dims(14) + divider(10) + meta(12) + pad(9.5)
    boxh = h - pad - (9.5 + 15 + 12.8 + 14 + 10 + 12 + 0) - 9.5
    # images
    if p["section"] == "S3":
        draw_img_contain(c, os.path.join(IMG, p["mold"]), x + pad, top - boxh, boxw, boxh, bg=HexColor("#F0EDE7"))
        draw_img_contain(c, os.path.join(IMG, p["natija"]), x + pad + boxw + 8, top - boxh, boxw, boxh, bg=HexColor("#F0EDE7"))
    else:
        draw_img_cover(c, os.path.join(IMG, p["mold"]), x + pad, top - boxh, boxw, boxh)
        draw_img_cover(c, os.path.join(IMG, p["natija"]), x + pad + boxw + 8, top - boxh, boxw, boxh)
    # thin inner borders
    c.setStrokeColor(BORDER); c.setLineWidth(0.5)
    c.rect(x + pad, top - boxh, boxw, boxh, stroke=1, fill=0)
    c.rect(x + pad + boxw + 8, top - boxh, boxw, boxh, stroke=1, fill=0)

    # code chip
    chipw = chip(c, x + pad, top - 14, p["code"], "DVB", 7.2, RED, WHITE, 5, 13)
    if p.get("isNew"):
        chip(c, x + pad + chipw + 4, top - 14, "YANGI", "DVB", 7.2, HexColor("#2E7D46"), WHITE, 5, 13)

    # labels
    ly = top - boxh - 9.5
    ctext(c, x + pad + boxw/2, ly, "QO‘LIP", "DV", 6.4, HexColor("#7A7A7A"), track=0.5)
    lab2 = "NATIJA" if p["section"] != "S3" else "QUYMA / QO‘LLANISH"
    ctext(c, x + pad + boxw + 8 + boxw/2, ly, lab2, "DV", 6.4, HexColor("#7A7A7A"), track=0.5)

    # name (max 2 lines, fixed zone -> all cards aligned)
    lines = wrap(p["name"].upper(), "DVB", 10.2, w - 2*pad)[:2]
    ny = ly - 15
    for ln in lines:
        text(c, x + pad, ny, ln, "DVB", 10.2, DARK)
        ny -= 12.8

    dims_y = ly - 15 - 12.8 - 14
    dsize = 8.4 if len(p["dims"]) < 26 else 7.0
    text(c, x + pad, dims_y, p["dims"], "DVB", dsize, HexColor("#4A4A4A"))

    div_y = dims_y - 10
    c.setStrokeColor(BORDER); c.setLineWidth(0.5)
    c.line(x + pad, div_y, x + w - pad, div_y)
    text(c, x + pad, div_y - 12, "Polipropilen / ABS — plastik qolip", "DV", 7.2, GRAY)

def products_page(c, items, section_key, pageno):
    header(c, section_key)
    footer(c, pageno)
    gx, gy = MARGIN, 12
    top_y, bot_y = H - 78, 46
    gw = W - MARGIN*2
    cardw = (gw - gy) / 2
    cardh = (top_y - bot_y - 2*gy) / 3
    for i, p in enumerate(items):
        col, row = i % 2, i // 2
        x = gx + col * (cardw + gy)
        y = top_y - (row + 1) * cardh - row * gy
        product_card(c, p, x, y, cardw, cardh)

# ---------- order page ----------
def order_page(c, pageno):
    header(c, label="Buyurtma")
    footer(c, pageno)
    y = H - 100
    text(c, MARGIN, y, "TANLOVDAN —", "DVB", 21, DARK)
    y -= 24
    text(c, MARGIN, y, "BUYURTMAGA.", "DVB", 21, DARK)
    y -= 12
    c.setFillColor(RED); c.rect(MARGIN, y, 54, 3, stroke=0, fill=1)
    y -= 30
    steps = [
        ("01", "Qolipni tanlang", "Katalogdan yoqqan modelni toping va uning kodini yozib oling "
         "(masalan, G014 yoki A10-007). Rasmiy nom muhim emas — kod yetarli."),
        ("02", "Tafsilotlarni aniqlang", "Menejer bilan o‘lcham, komplekt tarkibi, kerakli miqdor, "
         "mavjudlik va joriy narxni kelishing. Yulduzchali (*) o‘lchamlar shu bosqichda aniq tasdiqlanadi."),
        ("03", "Buyurtmani tasdiqlang", "To‘lov va ishlab chiqarish jadvali kelishiladi. Tayyor bo‘lgach, "
         "mahsulotni zavoddan olib ketishingiz yoki yetkazib berishni tashkil qilishingiz mumkin."),
    ]
    sh = 100
    for n, t, d in steps:
        y -= sh + 16
        c.setFillColor(BGWARM); c.setStrokeColor(BORDER); c.setLineWidth(0.7)
        c.roundRect(MARGIN, y, W - 2*MARGIN, sh, 5, stroke=1, fill=1)
        c.setFillColor(RED); c.rect(MARGIN, y, 4, sh, stroke=0, fill=1)
        text(c, MARGIN + 16, y + sh - 30, n, "DVB", 18, RED)
        text(c, MARGIN + 62, y + sh - 30, t, "DVB", 12, DARK)
        yy = y + sh - 50
        for ln in wrap(d, "DV", 8.8, W - 2*MARGIN - 62 - 14):
            yy -= 13; text(c, MARGIN + 62, yy + 13, ln, "DV", 8.8, HexColor("#4A4A4A"))
    ch = 170
    y = 52
    c.setFillColor(DARK)
    c.roundRect(MARGIN, y, W - 2*MARGIN, ch, 6, stroke=0, fill=1)
    lg = os.path.join(IMG, "logo_white.png")
    im = Image.open(lg); lw = 74
    c.drawImage(lg, MARGIN + 18, y + ch - 34, lw, lw*im.height/im.width, mask="auto")
    text(c, MARGIN + 18, y + ch - 62, "ALOQA", "DVB", 8.5, RED, track=1)
    yy = y + ch - 84
    text(c, MARGIN + 18, yy, CONTACTS["phone"], "DVB", 14, WHITE); yy -= 20
    text(c, MARGIN + 18, yy, CONTACTS["email"], "DV", 9.5, HexColor("#D8D8D8")); yy -= 17
    text(c, MARGIN + 18, yy, CONTACTS["web"] + "   ·   " + CONTACTS["addr"], "DV", 9.5, HexColor("#D8D8D8")); yy -= 17
    text(c, MARGIN + 18, yy, "Telegram / WhatsApp: " + CONTACTS["phone"], "DV", 9.5, HexColor("#D8D8D8")); yy -= 17
    text(c, MARGIN + 18, yy, "Yetkazib berish — menejer bilan kelishiladi", "DV", 9.5, HexColor("#D8D8D8"))
    text(c, W - MARGIN - 18 - sw("Narx va mavjudlik — so‘rov asosida", "DV", 7.6), y + 14,
         "Narx va mavjudlik — so‘rov asosida", "DV", 7.6, HexColor("#9A9A9A"))

# ---------- back cover ----------
def back_cover(c):
    c.setFillColor(DARK); c.rect(0, 0, W, H, stroke=0, fill=1)
    lg = os.path.join(IMG, "logo_white.png")
    im = Image.open(lg); lw = 130
    c.drawImage(lg, (W - lw)/2, H/2 + 40, lw, lw*im.height/im.width, mask="auto")
    ctext(c, W/2, H/2 + 6, "QO‘LIPLAR KATALOGI — 2026", "DVB", 12, WHITE, track=1.2)
    c.setFillColor(RED); c.rect(W/2 - 26, H/2 - 8, 52, 2.6, stroke=0, fill=1)
    yy = H/2 - 60
    for ln, f, s, col in [(CONTACTS["phone"], "DVB", 11.5, WHITE),
                          (CONTACTS["email"], "DV", 9.5, HexColor("#CFCFCF")),
                          (CONTACTS["web"], "DV", 9.5, HexColor("#CFCFCF")),
                          (CONTACTS["addr"], "DV", 9.5, HexColor("#9A9A9A"))]:
        ctext(c, W/2, yy, ln, f, s, col); yy -= 18
    ctext(c, W/2, 30, "SHAKL. NAQSH. NATIJA.", "DVB", 8, HexColor("#6E6E6E"), track=1.6)

# ---------- build ----------
def build(out_path):
    c = canvas.Canvas(out_path, pagesize=(W, H), pageCompression=1)
    c.setTitle("SPS — QO‘LIPLAR KATALOGI 2026")
    c.setAuthor("STONE PROFY SERVISE (SPS)")
    c.setSubject("Bruschatka, dekorativ plita, panel va profil qoliplari — to‘liq katalog")

    s1 = [p for p in PRODUCTS if p["section"] == "S1"]
    s2 = [p for p in PRODUCTS if p["section"] == "S2"]
    s3 = [p for p in PRODUCTS if p["section"] == "S3"]
    PER = 6
    pages1 = (len(s1) + PER - 1) // PER
    pages2 = (len(s2) + PER - 1) // PER
    pages3 = (len(s3) + PER - 1) // PER
    # page numbering plan
    p_cover = 1
    p_info = 2
    p_toc = 3
    p_div1 = 4
    p_s1 = p_div1 + 1                       # 5
    p_div2 = p_s1 + pages1                  # 10
    p_s2 = p_div2 + 1                       # 11
    p_div3 = p_s2 + pages2                  # 24
    p_s3 = p_div3 + 1                       # 25
    p_order = p_s3 + pages3                 # 30
    sec_pages = {"S1": p_s1, "S2": p_s2, "S3": p_s3}

    cover(c); c.showPage()
    info_page(c, p_info); c.showPage()
    toc_page(c, p_toc, sec_pages); c.showPage()

    divider(c, "S1", p_div1); c.showPage()
    for k in range(pages1):
        products_page(c, s1[k*PER:(k+1)*PER], "S1", p_s1 + k); c.showPage()

    divider(c, "S2", p_div2); c.showPage()
    for k in range(pages2):
        products_page(c, s2[k*PER:(k+1)*PER], "S2", p_s2 + k); c.showPage()

    divider(c, "S3", p_div3); c.showPage()
    for k in range(pages3):
        products_page(c, s3[k*PER:(k+1)*PER], "S3", p_s3 + k); c.showPage()

    order_page(c, p_order); c.showPage()
    back_cover(c); c.showPage()

    c.save()
    print("saved", out_path)

if __name__ == "__main__":
    build(os.path.join(ROOT, "SPS-Qoliplar-Katalogi-2026.pdf"))
