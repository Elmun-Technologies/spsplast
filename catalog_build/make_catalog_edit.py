#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SPS Qoliplar Katalogi 2026 — v2.1 editorial (landscape A4).
Har bir mahsulot — alohida jurnal-uslubidagi sahifa.
"""
import json, os
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from PIL import Image

# ---------------------------------------------------------------- setup
W, H = 841.89, 595.28           # A4 landscape
HW = W / 2.0
M = 34.0

DARK  = HexColor("#161616")
DARK2 = HexColor("#1E1E1E")
RED   = HexColor("#E31E24")
BGWARM= HexColor("#F6F3EE")
INK   = HexColor("#2B2B2B")
GRAY  = HexColor("#7A7A7A")
LGRAY = HexColor("#C9C9C9")
WHITE = HexColor("#FFFFFF")

IMG = "images"
OUT = "SPS-Qoliplar-Katalogi-2026-edit.pdf"

_font_candidates = [
    ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
     "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ("/usr/share/fonts/dejavu/DejaVuSans.ttf",
     "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf"),
]
_use_tt = False
for r, b in _font_candidates:
    if os.path.exists(r) and os.path.exists(b):
        pdfmetrics.registerFont(TTFont("DV", r))
        pdfmetrics.registerFont(TTFont("DVB", b))
        _use_tt = True
        break
if not _use_tt:
    print("WARN: DejaVu not found, falling back to Helvetica")
    pdfmetrics.registerFontFamily("DV", "Helvetica")
    pdfmetrics.registerFontFamily("DVB", "Helvetica-Bold")
    swf = pdfmetrics.stringWidth
else:
    F_REG = "DV"; F_BOLD = "DVB"
F_REG = "DV" if _use_tt else "Helvetica"
F_BOLD = "DVB" if _use_tt else "Helvetica-Bold"

from reportlab.pdfbase.pdfmetrics import stringWidth as _sw
def sw(s, font, size, track=0):
    return _sw(s, font, size) + track * max(0, len(s) - 1)

def bigw(s, size, font=F_BOLD, hscale=100, track=0):
    return _sw(s, font, size) * hscale / 100.0 + track * max(0, len(s) - 1)

# ---------------------------------------------------------------- low-level text helpers
def text(c, x, y, s, font, size, col, track=0, alpha=1):
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setFillColor(col)
    if track:
        t.setCharSpace(track)
    t.textOut(s)
    if alpha < 1:
        c.saveState(); c.setFillAlpha(alpha)
    c.drawText(t)
    if alpha < 1:
        c.restoreState()

def rtext(c, x, y, s, font, size, col, track=0, alpha=1):
    text(c, x - sw(s, font, size, track), y, s, font, size, col, track, alpha)

def ctext(c, x, y, s, font, size, col, track=0, alpha=1):
    text(c, x - sw(s, font, size, track) / 2, y, s, font, size, col, track, alpha)

def big(c, x, y, s, size, col, hscale=84, font=F_BOLD, track=0, alpha=1):
    """Condensed-look bold text via horizontal scaling."""
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setHorizScale(hscale)
    t.setFillColor(col)
    if track:
        t.setCharSpace(track)
    t.textOut(s)
    if alpha < 1:
        c.saveState(); c.setFillAlpha(alpha)
    c.drawText(t)
    if alpha < 1:
        c.restoreState()

def fit_lines(ss, maxw, start, min_size=10, font=F_BOLD, hscale=84, track=0):
    size = start
    while size > min_size:
        if all(bigw(s, size, font, hscale, track) <= maxw for s in ss):
            return size
        size -= 1
    return size

def wrap_hs(s, size, maxw, font=F_REG, hscale=100):
    words = s.split()
    lines, cur = [], ""
    for wd in words:
        tst = (cur + " " + wd).strip()
        if bigw(tst, size, font, hscale) <= maxw:
            cur = tst
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines

def img_size(path):
    with Image.open(path) as im:
        return im.size

def draw_contain(c, path, x, y, w, h, anchor="c"):
    iw, ih = img_size(path)
    sc = min(w / iw, h / ih)
    dw, dh = iw * sc, ih * sc
    dx = x + (w - dw) / 2
    dy = y + (h - dh) / 2
    c.drawImage(path, dx, dy, dw, dh, preserveAspectRatio=True)
    return dx, dy, dw, dh

def draw_cover(c, path, x, y, w, h):
    """Cover-crop an image into box (no distortion)."""
    iw, ih = img_size(path)
    sc = max(w / iw, h / ih)
    dw, dh = iw * sc, ih * sc
    dx = x - (dw - w) / 2
    dy = y - (dh - h) / 2
    c.saveState()
    pp = c.beginPath(); pp.rect(x, y, w, h); c.clipPath(pp, stroke=0, fill=0)
    c.drawImage(path, dx, dy, dw, dh)
    c.restoreState()

def hstrip(c, x, y, w, h, col, alpha=1.0):
    c.saveState()
    if alpha < 1:
        c.setFillColor(col); c.setFillAlpha(alpha)
    else:
        c.setFillColor(col)
    c.rect(x, y, w, h, stroke=0, fill=1)
    c.restoreState()

def rrect(c, x, y, w, h, r, col, fill=1, alpha=1):
    c.saveState()
    c.setFillColor(col)
    if alpha < 1:
        c.setFillAlpha(alpha)
    c.roundRect(x, y, w, h, r, stroke=0, fill=fill)
    c.restoreState()

# ---------------------------------------------------------------- product helpers
PRODS = json.load(open("products.json", encoding="utf-8"))

def mold_path(p):  return os.path.join(IMG, p["mold"])
def env_path(p):   return os.path.join(IMG, p["code"] + "_envp.jpg")
def quyma_path(p):
    if p["section"] == "S3":
        return os.path.join(IMG, p["code"] + "_envfull.jpg")
    return os.path.join(IMG, p["natija"])

def dims_display(p):
    return p["dims"]

def footnote_text(p):
    if p.get("assumed"):
        return True, "* Standart o‘lcham. Buyurtmada menejer bilan tasdiqlanadi."
    return False, "* Eski katalog bo‘yicha. O‘lcham tasdiqlanadi."

SECTIONS = {
    "S1": ("01", "BRUSCHATKA VA TROTUAR QOLIPLARI", "Bruschatka qoliplari"),
    "S2": ("02", "DEKORATIV PLITA QOLIPLARI", "Dekorativ plita qoliplari"),
    "S3": ("03", "PANEL VA PROFIL QOLIPLARI", "Panel va profil qoliplari"),
}

# ---------------------------------------------------------------- small UI atoms
def chip(c, x, y, s, col_bg=RED, col_tx=WHITE, size=8, pad=6):
    rrect(c, x, y - size * 0.38 - pad + 3, sw(s, F_BOLD, size) + pad * 2, size + pad * 2 - 3, 2, col_bg)
    text(c, x + pad, y - size * 0.38, s, F_BOLD, size, col_tx)

def ai_chip(c, x, y, dark=True):
    s = "AI VIZUALIZATSIYA"
    size = 5.6
    w = sw(s, F_BOLD, size, 0.6) + 12
    rrect(c, x, y, w, 14, 7, DARK, alpha=0.78)
    ctext(c, x + w / 2, y + 4.4, s, F_BOLD, size, WHITE, track=0.6)

def pageno(c, n, side="left", dark=False):
    col = WHITE if dark else INK
    if side == "left":
        text(c, M, 26, f"{n:02d}", F_BOLD, 9, col)
        c.setFillColor(RED); c.rect(M + 18, 25.5, 3, 9, stroke=0, fill=1)
    else:
        rtext(c, W - M - 16, 26, f"{n:02d}", F_BOLD, 9, col)
        c.setFillColor(RED); c.rect(W - M - 11, 25.5, 3, 9, stroke=0, fill=1)

def running_footer(c, dark=False):
    col = WHITE if dark else LGRAY
    text(c, M, 13.5, "SPS  ·  QO'LIPLAR KATALOGI — 2026", F_REG, 5.5, col, track=1.2)

def ghost_code(c, x, y, code, size=150, col=INK, alpha=0.045):
    big(c, x, y, code, size, col, hscale=90, alpha=alpha)

def name_block_red(c, x, ytop, w, lines, size, col_fg=WHITE):
    """Red block with white product name lines; returns bottom y."""
    lh = size * 1.02
    pad_x, pad_y = 14, 12
    total_h = len(lines) * lh + pad_y * 2
    y0 = ytop - total_h
    hstrip(c, x, y0, w, total_h, RED)
    yy = ytop - pad_y - size * 0.8
    for ln in lines:
        big(c, x + pad_x, yy, ln, size, col_fg, hscale=84)
        yy -= lh
    return y0

def hline(c, x1, x2, y, col=HexColor("#DDDDDD"), w_=0.7):
    c.setStrokeColor(col); c.setLineWidth(w_)
    c.line(x1, y, x2, y)

def hw_headline(c, x, ytop, w, txt, bg=RED, fg=WHITE, size=21, pad=10):
    """Headline sentence in red block on env. Returns bottom y."""
    ls = wrap_hs(txt, size, w - pad * 2, F_BOLD, 84)
    lh = size * 1.04
    total_h = len(ls) * lh + pad * 2
    y0 = ytop - total_h
    hstrip(c, x, y0, w, total_h, bg)
    yy = ytop - pad - size * 0.82
    for ln in ls:
        big(c, x + pad, yy, ln, size, fg, hscale=84)
        yy -= lh
    return y0

def capt(c, x, y, num, lab, numcol=RED):
    text(c, x, y, num, F_BOLD, 8.5, numcol)
    text(c, x + sw(num, F_BOLD, 8.5) + 4, y, lab, F_BOLD, 8, INK)

# ================================================================ COVER
def page_cover(c):
    c.setFillColor(DARK); c.rect(0, 0, W, H, stroke=0, fill=1)
    # right part: full-bleed env
    xr = W * 0.5
    draw_cover(c, os.path.join(IMG, "coverR.jpg"), xr, 0, W - xr, H)
    # vertical red hairline at boundary
    c.setFillColor(RED); c.rect(xr - 1.5, 0, 3, H, stroke=0, fill=1)
    # gradient-ish dark veil on left edge of image
    hstrip(c, xr, 0, 46, H, DARK, alpha=0.32)

    x0 = M
    # logo
    c.drawImage(os.path.join(IMG, "logo_white.png"), x0, H - 108, height=54, width=118,
                mask="auto", preserveAspectRatio=True)
    # kicker
    text(c, x0 + 2, H - 148, "BRUSCHATKA · DEKORATIV PLITA · PANEL VA PROFIL", F_BOLD, 7.5,
         HexColor("#BBBBBB"), track=1.1)
    # giant title
    big(c, x0, H - 236, "QO'LIPLAR", 74, WHITE, hscale=80)
    big(c, x0, H - 302, "KATALOGI", 74, RED, hscale=80)
    c.setFillColor(RED); c.rect(x0 + 2, H - 326, 52, 5, stroke=0, fill=1)

    text(c, x0 + 2, H - 352, "Har bir mahsulot — qolip, quyma va makon ko‘rinishi bilan.", F_REG, 9.5, HexColor("#CCCCCC"))

    # model counter
    text(c, x0 + 2, H - 420, "130", F_BOLD, 52, WHITE)
    text(c, x0 + 96, H - 400, "TA MODEL", F_BOLD, 10, RED, track=2)

    # bottom contacts
    hline(c, x0, xr - 30, 92, HexColor("#3A3A3A"), 0.8)
    text(c, x0, 66, "+998 (98) 300-77-72", F_BOLD, 11, WHITE)
    text(c, x0, 48, "stoneprofyservice@mail.ru   ·   www.sps.uz", F_REG, 8, HexColor("#999999"))
    rtext(c, xr - 30, 60, "2026", F_BOLD, 30, HexColor("#3A3A3A"))
    text(c, W - M - 1, 26, "", F_REG, 6, GRAY)
    text(c, x0, 26, "TOSHKENT — ISHLAB CHIQARUVCHI", F_REG, 6.5, HexColor("#777777"), track=1.6)

# ================================================================ KONSEPSIYA
def page_konsepsiya(c, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    ghost_code(c, HW - 40, 40, "02", 270, INK, 0.03)
    x0 = M
    c.drawImage(os.path.join(IMG, "logo_dark.jpg"), x0, H - 92, height=44, width=100)
    rtext(c, W - M, H - 64, "KONSEPSIYA", F_BOLD, 10, RED, track=1.6)
    c.setFillColor(RED); c.rect(W - M + 10 - 2, H - 90, 3, 34, stroke=0, fill=1)

    big(c, x0, H - 196, "QOLIPDAN", 58, INK, hscale=82)
    big(c, x0, H - 254, "NATIJAGA.", 58, RED, hscale=82)

    y = H - 292
    facts = [
        ("Material", "Polipropilen / ABS — mustahkam, aniq geometriyali plastik qolip."),
        ("O‘lchamlar", "Millimetrda (mm): uzunlik × kenglik × balandlik. A / B / V — komplekt elementlari."),
        ("* izoh", "Yulduzchali o‘lchamlar — standart qiymat, buyurtmada menejer tasdiqlaydi."),
        ("Vizual", "Quyma va makon ko‘rinishlari — AI vizualizatsiya (natija haqida tasavvur uchun)."),
    ]
    right_lim = 0.44 * W + 20
    for t, d in facts:
        c.setFillColor(RED); c.circle(x0 + 3, y + 3, 1.7, stroke=0, fill=1)
        tw_ = sw(t + " — ", F_BOLD, 9)
        text(c, x0 + 12, y, t + " — ", F_BOLD, 9, INK)
        words = d.split()
        first, cur, x_start, yy = True, "", x0 + 12 + tw_, y
        for wd in words:
            maxw = right_lim - (x_start if first else x0 + 12)
            tst = (cur + " " + wd).strip()
            if bigw(tst, 8.6, F_REG, 100) <= maxw:
                cur = tst
            else:
                text(c, x_start if first else x0 + 12, yy, cur, F_REG, 8.6, HexColor("#555555"))
                first = False; yy -= 12.5; cur = wd
        if cur:
            text(c, x_start if first else x0 + 12, yy, cur, F_REG, 8.6, HexColor("#555555"))
        y = yy - 19

    # bottom: mold thumbs strip
    strip_y = 40
    thumbs = ["G001_envp.jpg", "G007_envp.jpg", "G013_envp.jpg", "G016_envp.jpg", "G040_envp.jpg", "G053_envp.jpg"]
    tw2 = (right_lim - x0 - 5 * 8) / 6
    text(c, x0, strip_y + tw2 * 0.72 + 14, "TANLOVDAN NAMUNALAR — 130+ VARIANT", F_BOLD, 7, LGRAY, track=1.4)
    for i, tf in enumerate(thumbs):
        tx = x0 + i * (tw2 + 8)
        hstrip(c, tx - 2, strip_y - 2, tw2 + 4, tw2 * 0.72 + 4, BGWARM)
        draw_cover(c, os.path.join(IMG, tf), tx, strip_y, tw2, tw2 * 0.72)

    # right side: 3-step visual
    rx = 0.48 * W + 10
    rw = W - M - rx
    py = H - 150
    mw = 150; qz = 120
    draw_contain(c, os.path.join(IMG, "info_mold.jpg"), rx, py - 140, mw, 140)
    capt(c, rx, py - 155, "01", "/ QOLIP")
    text(c, rx + mw + 12, py - 78, "→", F_REG, 16, LGRAY)
    draw_contain(c, os.path.join(IMG, "info_quyma.jpg"), rx + mw + 38, py - 140, qz, 120, )
    capt(c, rx + mw + 38, py - 155, "02", "/ QUYMA")
    ey = py - 190
    draw_cover(c, os.path.join(IMG, "kons_env.jpg"), rx, ey - 150, rw, 150)
    chip(c, rx + 8, ey - 22, "03 / TERILGAN KO'RINISH", RED, WHITE, 7)
    rtext(c, rx + rw, ey - 170, "Quyma va makon — AI vizualizatsiya.", F_REG, 7.5, GRAY)
    pageno(c, n, "left")
    running_footer(c)

# ================================================================ TEXNIK ESLOM
def page_texnik(c, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    ghost_code(c, HW - 60, 30, "03", 270, INK, 0.03)
    x0 = M
    c.drawImage(os.path.join(IMG, "logo_dark.jpg"), x0, H - 92, height=44, width=100)
    rtext(c, W - M, H - 64, "TEXNIK ESLOM", F_BOLD, 10, RED, track=1.6)
    c.setFillColor(RED); c.rect(W - M + 8, H - 90, 3, 34, stroke=0, fill=1)

    big(c, x0, H - 188, "QANDAY", 58, INK, hscale=82)
    big(c, x0, H - 246, "TANLASH?", 58, RED, hscale=82)
    text(c, x0 + 2, H - 278, "Katalog bilan ishlash — 3 daqiqada.", F_REG, 9.5, GRAY)

    steps = [
        ("01 / QOLIP — fotodagi plastik forma", "Siz buyurtma qiladigan asob. Har bir karta boshidagi katta foto — ana shu qolip."),
        ("02 / QUYMA — tayyor beton buyum", "AI tomonidan yaratilgan vizualizatsiya: naqsh plitaga qanday chiqishini ko‘rsatadi."),
        ("03 / MAKON — terilgandagi ko‘rinish", "Suniy intellekt sahnasi: bruschatka hovlida, panel devorga o‘rnatilgan holatda."),
    ]
    y = H - 330
    for t, d in steps:
        c.setFillColor(RED); c.rect(x0, y - 3, 3, 30, stroke=0, fill=1)
        text(c, x0 + 12, y, t, F_BOLD, 9.5, INK)
        for ln in wrap_hs(d, 8.6, 0.42 * W - 20, F_REG, 100):
            y -= 13
            text(c, x0 + 12, y, ln, F_REG, 8.6, HexColor("#555555"))
        y -= 22

    # right column: fact cards
    rx = 0.5 * W + 10
    cw_ = W - M - rx
    cards = [
        ("MATERIAL", [("Polipropilen", "Silliq yuzalar, yengil va moslashuvchan."),
                     ("ABS plastik", "Qattiqroq — o‘tkir qirrali naqshlar uchun.")]),
        ("A / B / V — KOMPLEKT", [("Bitta model — bir necha detal", "Kartadagi o‘lchamlar yonma-yon ko‘rsatiladi."),
                                  ("Buyurtmada", "Qaysi elementlar kerakligini ayting — yig‘ib beramiz.")]),
        ("HALOLLIK BEIGISI", [("AI vizualizatsiya", "Makonlar va quymalar suniy intellekt bilan yaratilgan."),
                              ("Qolip fotolari esa", "Haqiqiy mahsulotlar — zavoddan.")]),
    ]
    cy = H - 150
    for head, rows in cards:
        hstrip(c, rx, cy - 22, cw_, 22, DARK if head != "HALOLLIK BEIGISI" else RED)
        text(c, rx + 10, cy - 15, head, F_BOLD, 8.5, WHITE, track=1.2)
        cy -= 26
        for k, v in rows:
            cy -= 13.5
            text(c, rx + 10, cy, "· " + k, F_BOLD, 8.3, INK)
            kk = sw("· " + k + " — ", F_BOLD, 8.3)
            text(c, rx + 10 + kk, cy, "— " + v, F_REG, 8.3, HexColor("#555555"))
        cy -= 18
    rtext(c, W - M, 96, "Qolipdan natijagacha — SPS siz bilan.", F_BOLD, 9, RED)
    pageno(c, n, "left")
    running_footer(c)

# ================================================================ INDEX
def page_index(c, n, page_map):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    big(c, M, H - 74, "MUNDARIJA", 40, INK, hscale=84)
    c.setFillColor(RED); c.rect(M + 2, H - 86, 46, 4, stroke=0, fill=1)
    rtext(c, W - M, H - 60, "130 ta model", F_BOLD, 9.5, GRAY)

    cols = 4
    colw = (W - 2 * M - (cols - 1) * 10) / cols
    entries = []
    for s in ("S1", "S2", "S3"):
        entries.append(("head", SECTIONS[s][2].upper()))
        for p in [pp for pp in PRODS if pp["section"] == s]:
            entries.append(("item", (p["code"], p["name"], page_map[p["code"]])))

    col, rows_y = 0, []
    x = M
    y = H - 106
    top_y = y
    line_h = 12.8
    for kind, data in entries:
        if y - line_h < 40 and kind != "head":
            col += 1
            y = top_y
            if col >= cols:
                break
            x = M + col * (colw + 10)
        if kind == "head":
            y -= line_h - 2
            text(c, x, y, data, F_BOLD, 8.6, RED, track=0.6)
            c.setFillColor(RED); c.rect(x, y - 3.5, 22, 2, stroke=0, fill=1)
            y -= 5
        else:
            code, name, pg = data
            y -= line_h
            text(c, x, y, code, F_BOLD, 7.6, INK)
            cx = x + sw(code, F_BOLD, 7.6) + 5
            text(c, cx, y, name, F_REG, 7.6, HexColor("#444444"))
            nx = x + colw
            rtext(c, nx, y, str(pg), F_REG, 7.6, GRAY)

    text(c, M, 26, "* — standart o‘lcham (buyurtmada tasdiqlanadi)   ·   Barcha o‘lchamlar millimetrda (mm)   ·   Quyma va makon ko‘rinishlari — AI vizualizatsiya",
         F_REG, 6.6, GRAY)
    pageno(c, n, "right")
    running_footer(c)

# ================================================================ DIVIDERS
def page_divider(c, n, sec_id, img):
    c.setFillColor(DARK); c.rect(0, 0, W, H, stroke=0, fill=1)
    num, title, sub = SECTIONS[sec_id]
    # right half image full-bleed
    draw_cover(c, os.path.join(IMG, img), HW, 0, HW, H)
    c.setFillColor(RED); c.rect(HW - 1.5, 0, 3, H, stroke=0, fill=1)
    # giant outlined number
    c.saveState()
    c.setLineWidth(2.6)
    t = c.beginText(HW / 2 - 82, H - 330)
    t.setFont(F_BOLD, 300); t.setTextRenderMode(1)
    t.setStrokeColor(RED); t.setFillColor(RED, 0)
    t.textOut(num)
    c.drawText(t)
    c.restoreState()

    text(c, M, H - 352, "BO'LIM", F_BOLD, 8.5, HexColor("#BBBBBB"), track=2.4)
    big(c, M - 2, H - 412, title.split(" QOLIPLARI")[0] if " QOLIPLARI" in title else title, 40, WHITE, hscale=82)
    big(c, M - 2, H - 452, "QOLIPLARI", 40, RED, hscale=82)
    cnt = len([p for p in PRODS if p["section"] == sec_id])
    text(c, M + 2, H - 488, f"{cnt} ta modeli — har biri alohida sahifada", F_REG, 9, HexColor("#999999"))

    # thumbs strip of first 6 molds of section
    thumbs = [p["code"] + "_envp.jpg" for p in PRODS if p["section"] == sec_id][:6]
    tw2 = (HW - 2 * M - 5 * 8) / 6
    for i, tf in enumerate(thumbs):
        tx = M + i * (tw2 + 8)
        hstrip(c, tx - 2, 38, tw2 + 4, tw2 * 0.72 + 4, DARK2)
        draw_cover(c, os.path.join(IMG, tf), tx, 40, tw2, tw2 * 0.72)
        c.setStrokeColor(HexColor("#3A3A3A")); c.setLineWidth(0.6)
        c.rect(tx, 40, tw2, tw2 * 0.72, stroke=1, fill=0)
    text(c, M, 20, "BO'LIMDAN NAMUNALAR", F_BOLD, 6, HexColor("#666666"), track=1.6)
    pageno(c, n, "right")

# ================================================================ PRODUCT PAGES — TEMPLATES
def draw_dims_block(c, x0, by, p, ink, maxw, matcol, fncol):
    dtxt = dims_display(p)
    size = fit_lines([dtxt], maxw, 19, 11, hscale=88)
    split = size <= 12 and "·" in dtxt
    bar_h = 56 if split else 42
    c.setFillColor(RED); c.rect(x0, by - 4, 3, bar_h, stroke=0, fill=1)
    if split:
        parts = [s.strip() for s in dtxt.split("·")][:2]
        big(c, x0 + 12, by + 30, parts[0], 14, ink, hscale=88)
        if len(parts) > 1:
            big(c, x0 + 12, by + 15, parts[1], 14, ink, hscale=88)
        text(c, x0 + 12, by + 44, "Material: Polipropilen / ABS plastik", F_REG, 7, matcol)
        text(c, x0 + 12, by + 1, footnote_text(p)[1], F_REG, 7, fncol)
    else:
        big(c, x0 + 12, by + 18, dtxt, size, ink, hscale=88)
        text(c, x0 + 12, by + 30, "Material: Polipropilen / ABS plastik", F_REG, 7, matcol)
        text(c, x0 + 12, by + 2, footnote_text(p)[1], F_REG, 7, fncol)

def foot_area(c, x0, p, ink=INK, lim=None, right_lab="SPS / QOLIP VA NATIJA"):
    """Dims block + footnote near bottom left, on white bg."""
    by = 76
    maxw = (lim if lim else W - M) - x0 - 14
    draw_dims_block(c, x0, by, p, ink, maxw, HexColor("#9A9A9A"), GRAY)
    if lim and right_lab:
        rtext(c, lim, by + 2, right_lab, F_BOLD, 7, RED, track=0.8)

# ---- A: info left (white) | env right
def page_A(c, p, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    ghost_code(c, 150, H - 148, p["code"], 88, INK, 0.04)
    # right env
    draw_cover(c, env_path(p), HW, 0, HW, H)
    ai_chip(c, W - M - 96, 16)
    hw_headline(c, HW + 22, H - 34, min(300, HW - 80), p["headline"], RED, WHITE, 21)
    # left info
    x0 = M
    c.drawImage(os.path.join(IMG, "logo_dark.jpg"), x0, H - 82, height=36, width=84)
    rtext(c, HW - M + 4, H - 60, p["code"], F_BOLD, 11, INK, track=0.5)
    # name red block
    name = p["name"].upper()
    size = fit_lines([name], HW - 2 * M - 10, 44, 22, hscale=84)
    y0 = name_block_red(c, x0, H - 122, min(HW - 2 * M - 6, bigw(name, size, F_BOLD, 84) + 30), [name], size)
    text(c, x0 + 2, y0 - 26, p["slogan"], F_REG, 10.5, GRAY)
    # 01 mold
    by = y0 - 44
    mbox_w, mbox_h = 262, 206
    my = by - mbox_h
    draw_contain(c, mold_path(p), x0, my, mbox_w, mbox_h)
    capt(c, x0, my - 13, "01", "/ QOLIP")
    # arrow + quyma
    qz = 118
    qx = x0 + mbox_w + 30
    text(c, x0 + mbox_w + 8, my + qz / 2 - 5, "→", F_REG, 15, LGRAY)
    draw_contain(c, quyma_path(p), qx, my, qz, qz)
    qlab = "/ QUYMA · AI" if p["section"] == "S3" else "/ QUYMA"
    capt(c, qx, my - 13, "02", qlab)
    foot_area(c, x0, p, lim=HW - 28)
    pageno(c, n, "left")
    running_footer(c)

# ---- B: env left | info right (white), dark headline strip on env
def page_B(c, p, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    ghost_code(c, W - 290, 70, p["code"], 112, INK, 0.035)
    draw_cover(c, env_path(p), 0, 0, HW, H)
    ai_chip(c, M, 16)
    # dark translucent strip bottom-left with headline
    lh = 21 * 1.04
    ls = wrap_hs(p["headline"], 21, HW - 120, F_BOLD, 84)
    total_h = len(ls) * lh + 34
    hstrip(c, 0, 40, HW * 0.94, total_h, DARK, alpha=0.68)
    yy = 40 + total_h - 20 - 21 * 0.82
    c.setFillColor(RED); c.rect(22, 40 + total_h - 14, 40, 4, stroke=0, fill=1)
    for ln in ls:
        big(c, 44, yy, ln, 21, WHITE, hscale=84)
        yy -= lh
    text(c, 44, 40 + 8, "AI VIZUALIZATSIYA / QO‘LLANISH NAMUNASI", F_REG, 6, HexColor("#CCCCCC"), track=1)
    # info right
    x0 = HW + 40
    secno = {"S1": "01", "S2": "02", "S3": "03"}[p["section"]]
    text(c, x0, H - 62, SECTIONS[p["section"]][2].upper(), F_BOLD, 9, RED, track=1.2)
    c.setFillColor(RED); c.rect(x0 - 12, H - 66, 5, 12, stroke=0, fill=1)
    rtext(c, W - M, H - 60, p["code"], F_BOLD, 11, INK, track=0.5)
    name = p["name"].upper()
    size = fit_lines([name], W - M - x0, 52, 24, hscale=80)
    big(c, x0, H - 122, name, size, INK, hscale=80)
    text(c, x0 + 2, H - 150, p["slogan"], F_REG, 10.5, GRAY)
    # mold + quyma
    mw = 196; qw = 148
    iy = H - 196 - 190
    draw_contain(c, mold_path(p), x0, iy, mw, 190)
    draw_contain(c, quyma_path(p), x0 + mw + 34, iy, qw, 190)
    text(c, x0 + mw + 14, iy + 90, "→", F_REG, 15, LGRAY)
    capt(c, x0, iy - 13, "01", "/ QOLIP")
    qlab = "/ QUYMA · AI" if p["section"] == "S3" else "/ QUYMA"
    capt(c, x0 + mw + 34, iy - 13, "02", qlab)
    foot_area(c, x0, p, lim=W - M)
    pageno(c, n, "right")
    running_footer(c)

# ---- C: left dark env-named strip + mold below | right "QOLIPDAN NATIJAGA"
def page_C(c, p, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    # left top: dark strip over env with big white name
    strip_h = 232
    draw_cover(c, env_path(p), 0, H - strip_h, HW, strip_h)
    hstrip(c, 0, H - strip_h, HW, strip_h, DARK, alpha=0.58)
    c.drawImage(os.path.join(IMG, "logo_white.png"), M, H - 66, height=30, width=70,
                mask="auto", preserveAspectRatio=True)
    rtext(c, HW - M + 4, H - 58, p["code"], F_BOLD, 11, WHITE, track=0.5)
    name = p["name"].upper()
    size = fit_lines([name], HW - 2 * M, 46, 24, hscale=82)
    big(c, M, H - 130, name, size, WHITE, hscale=82)
    text(c, M + 2, H - 156, p["slogan"], F_REG, 10.5, HexColor("#DDDDDD"))
    ai_chip(c, M, H - strip_h + 10)
    # below: mold big
    mbox_w = 232
    mbox_h = H - strip_h - 200
    bym = H - strip_h - 30 - mbox_h
    draw_contain(c, mold_path(p), M, bym, mbox_w, mbox_h)
    capt(c, M, bym - 13, "01", "/ QOLIP")
    foot_area(c, M, p, lim=HW - 24, right_lab="")
    # right half: "QOLIPDAN NATIJAGA"
    x0 = HW + 40
    warea = W - M - x0
    text(c, x0, H - 60, "QOLIPDAN NATIJAGA", F_BOLD, 10, RED, track=1.6)
    c.setFillColor(RED); c.rect(x0 - 12 + 2, H - 66, 5, 12, stroke=0, fill=1)
    if p["section"] != "S3":
        qy = H - 96 - 250
        draw_contain(c, quyma_path(p), x0 + (warea - 250) / 2, qy, 250, 250)
        ctext(c, x0 + warea / 2, qy - 13, "02  /  QUYMA VIZUALIZATSIYASI", F_BOLD, 8, INK)
        band = os.path.join(IMG, p["code"] + "_band.jpg")
        by = 66
        draw_cover(c, band, x0, by, warea, 132)
        ctext(c, x0 + warea / 2, by - 13, "03  /  MAKONDAGI KO‘RINISH", F_BOLD, 8, INK)
        ctext(c, x0 + warea / 2, by - 24, "AI vizualizatsiya", F_REG, 6.6, GRAY)
    else:
        ey = H - 96 - 300
        draw_cover(c, quyma_path(p), x0, ey, warea, 300)
        ctext(c, x0 + warea / 2, ey - 13, "02  /  QUYMA VA QO‘LLANISH", F_BOLD, 8, INK)
        ctext(c, x0 + warea / 2, ey - 24, "AI vizualizatsiya", F_REG, 6.6, GRAY)
        # mini facts card
        fy = ey - 58
        rrect(c, x0, fy - 72, warea, 58, 3, BGWARM)
        c.setFillColor(RED); c.rect(x0, fy - 72, 3, 58, stroke=0, fill=1)
        text(c, x0 + 12, fy - 30, "Kod", F_REG, 8, GRAY)
        text(c, x0 + 120, fy - 30, p["code"], F_BOLD, 8.3, INK)
        text(c, x0 + 12, fy - 46, "Material", F_REG, 8, GRAY)
        text(c, x0 + 120, fy - 46, "Polipropilen / ABS", F_REG, 8.3, INK)
        text(c, x0 + 12, fy - 62, "Qo‘llanishi", F_REG, 8, GRAY)
        text(c, x0 + 120, fy - 62, "Devor paneli / profil quyish", F_REG, 8.3, INK)
    pageno(c, n, "right")
    running_footer(c)

# ---- D (NEW): hero dark — env left | info right on DARK bg
def page_D(c, p, n):
    c.setFillColor(DARK); c.rect(0, 0, W, H, stroke=0, fill=1)
    ghost_code(c, W - 292, 64, p["code"], 112, WHITE, 0.05)
    # left env full-bleed
    draw_cover(c, env_path(p), 0, 0, HW, H)
    ai_chip(c, M, 16)
    # white translucent headline block over env bottom-left? use red block top-left
    hw_headline(c, 0, H - 30, min(310, HW - 60), p["headline"], RED, WHITE, 21)
    # right dark info
    x0 = HW + 40
    rtext(c, W - M, H - 60, p["code"], F_BOLD, 11, WHITE, track=0.5)
    sec_lab = {"S1": "BRUSCHATKA QOLIPLARI", "S2": "DEKORATIV PLITA QOLIPLARI", "S3": "PANEL VA PROFIL QOLIPLARI"}[p["section"]]
    text(c, x0, H - 60, sec_lab, F_BOLD, 9, RED, track=1.2)
    c.setFillColor(RED); c.rect(x0 - 12, H - 66, 5, 12, stroke=0, fill=1)
    name = p["name"].upper()
    size = fit_lines([name], W - M - x0, 50, 24, hscale=82)
    big(c, x0, H - 118, name, size, WHITE, hscale=82)
    text(c, x0 + 2, H - 146, p["slogan"], F_REG, 10.5, HexColor("#BBBBBB"))
    # mold & quyma on white cards
    cardw, cardh = 190, 180
    cy = H - 190 - cardh
    rrect(c, x0, cy, cardw, cardh, 3, WHITE)
    draw_contain(c, mold_path(p), x0 + 8, cy + 8, cardw - 16, cardh - 16)
    qw = 140
    rrect(c, x0 + cardw + 30, cy, qw, cardh, 3, WHITE)
    draw_contain(c, quyma_path(p), x0 + cardw + 38, cy + 8, qw - 16, cardh - 16)
    text(c, x0 + cardw + 12, cy + cardh / 2 - 6, "→", F_REG, 14, HexColor("#777777"))
    c_lab = HexColor("#AAAAAA")
    text(c, x0, cy - 13, "01", F_BOLD, 8.5, RED)
    text(c, x0 + 17, cy - 13, "/ QOLIP", F_BOLD, 8, c_lab)
    qlab = "/ QUYMA · AI" if p["section"] == "S3" else "/ QUYMA"
    text(c, x0 + cardw + 30, cy - 13, "02", F_BOLD, 8.5, RED)
    text(c, x0 + cardw + 47, cy - 13, qlab, F_BOLD, 8, c_lab)
    # dims on dark
    by = 76
    draw_dims_block(c, x0, by, p, WHITE, W - M - x0 - 14, HexColor("#777777"), HexColor("#8F8F8F"))
    pageno(c, n, "right", dark=True)
    running_footer(c, dark=True)

TEMPLATES = {"A": page_A, "B": page_B, "C": page_C, "D": page_D}
ROTATION = "ACBADCDB"
SEC_OFFSET = {"S1": 0, "S2": 3, "S3": 5}

# ================================================================ ORDER PAGE
def page_order(c, n):
    c.setFillColor(WHITE); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.drawImage(os.path.join(IMG, "logo_dark.jpg"), M, H - 92, height=44, width=100)
    big(c, M, H - 188, "TANLOVDAN —", 54, INK, hscale=82)
    big(c, M, H - 244, "BUYURTMAGA.", 54, RED, hscale=82)

    steps = [
        ("01", "Qolipni tanlang", "Katalogdan model toping, kodini yozib oling (masalan, G014 yoki A10-007)."),
        ("02", "Tafsilotlarni aniqlang", "O‘lcham, komplekt, miqdor, mavjudlik va joriy narx — menejer bilan."),
        ("03", "Buyurtmani tasdiqlang", "To‘lov va ishlab chiqarish jadvali kelishiladi, so‘ng yetkazib beriladi."),
    ]
    y = H - 300
    for num, t, d in steps:
        hstrip(c, M, y - 44, 0.5 * W - 44, 52, BGWARM)
        c.setFillColor(RED); c.rect(M, y - 44, 3, 52, stroke=0, fill=1)
        text(c, M + 14, y - 2, num, F_BOLD, 11, RED)
        text(c, M + 44, y - 2, t, F_BOLD, 10.5, INK)
        for ln in wrap_hs(d, 8.6, 0.5 * W - 110, F_REG, 100):
            y -= 14
            text(c, M + 44, y, ln, F_REG, 8.6, HexColor("#555555"))
        y -= 52

    # contact card on right
    rx = 0.52 * W
    cw_ = W - M - rx
    rrect(c, rx, 90, cw_, 260, 4, DARK)
    c.drawImage(os.path.join(IMG, "logo_white.png"), rx + 22, 90 + 260 - 66, height=40, width=94,
                mask="auto", preserveAspectRatio=True)
    text(c, rx + 22, 90 + 260 - 92, "ALOQA", F_BOLD, 9, RED, track=2)
    text(c, rx + 22, 90 + 260 - 124, "+998 (98) 300-77-72", F_BOLD, 16, WHITE)
    text(c, rx + 22, 90 + 260 - 146, "stoneprofyservice@mail.ru", F_REG, 9, HexColor("#BBBBBB"))
    text(c, rx + 22, 90 + 260 - 170, "www.sps.uz    ·    Toshkent, O‘zbekiston", F_REG, 9, HexColor("#BBBBBB"))
    text(c, rx + 22, 90 + 260 - 194, "Telegram / WhatsApp: +998 (98) 300-77-72", F_REG, 9, HexColor("#BBBBBB"))
    text(c, rx + 22, 90 + 260 - 218, "Yetkazib berish — menejer bilan kelishiladi", F_REG, 8, HexColor("#777777"))
    rrect(c, rx + 22, 90 + 18, cw_ - 44, 30, 15, RED)
    ctext(c, rx + 22 + (cw_ - 44) / 2, 90 + 27, "NARX VA MAVJUDLIK — SO‘ROV ASOSIDA", F_BOLD, 7.6, WHITE, track=0.8)
    pageno(c, n, "left")
    running_footer(c)

# ================================================================ BACK COVER
def page_back(c):
    c.setFillColor(DARK); c.rect(0, 0, W, H, stroke=0, fill=1)
    cx = W / 2
    c.drawImage(os.path.join(IMG, "logo_white.png"), cx - 59, H / 2 + 40, height=54, width=118,
                mask="auto", preserveAspectRatio=True)
    text(c, cx - sw("QO'LIPLAR KATALOGI — 2026", F_BOLD, 10, 2) / 2, H / 2 + 8,
         "QO'LIPLAR KATALOGI — 2026", F_BOLD, 10, WHITE, track=2)
    c.setFillColor(RED); c.rect(cx - 26, H / 2 - 8, 52, 3, stroke=0, fill=1)
    text(c, cx - sw("+998 (98) 300-77-72", F_BOLD, 13) / 2, H / 2 - 44, "+998 (98) 300-77-72", F_BOLD, 13, WHITE)
    ctext(c, cx, H / 2 - 66, "stoneprofyservice@mail.ru", F_REG, 9, HexColor("#999999"))
    ctext(c, cx, H / 2 - 86, "www.sps.uz", F_REG, 9, HexColor("#999999"))
    ctext(c, cx, H / 2 - 106, "Toshkent, O‘zbekiston", F_REG, 9, HexColor("#666666"))
    ctext(c, cx, 40, "SHAKL. NAQSH. NATIJA.", F_BOLD, 8, HexColor("#555555"), track=3)

# ================================================================ BUILD
def main():
    c = canvas.Canvas(OUT, pagesize=(W, H))
    c.setTitle("SPS Qoliplar Katalogi — 2026")
    c.setAuthor("Stone Profy Servise")
    c.setSubject("Bruschatka, dekorativ plita, panel va profil qoliplari — 130 ta model")

    # page number map
    page_map = {}
    n = 1
    page_cover(c); c.showPage(); n += 1
    page_konsepsiya(c, n); c.showPage(); n += 1
    page_texnik(c, n); c.showPage(); n += 1

    # map product pages first (needed for index)
    cursor = n + 1  # index page
    pmap = {}
    for s in ("S1", "S2", "S3"):
        cursor += 1  # divider
        for p in [pp for pp in PRODS if pp["section"] == s]:
            pmap[p["code"]] = cursor
            cursor += 1
    order_n = cursor
    back_n = cursor + 1

    page_index(c, n, pmap); c.showPage(); n += 1

    div_imgs = {"S1": "div1L.jpg", "S2": "div2L.jpg", "S3": "div3L.jpg"}
    gi = 0
    for s in ("S1", "S2", "S3"):
        page_divider(c, n, s, div_imgs[s]); c.showPage(); n += 1
        for i, p in enumerate([pp for pp in PRODS if pp["section"] == s]):
            t = ROTATION[(gi + SEC_OFFSET[s]) % len(ROTATION)]
            TEMPLATES[t](c, p, n)
            c.showPage(); n += 1
            gi += 1

    page_order(c, n); c.showPage(); n += 1
    page_back(c); c.showPage()

    c.save()
    print("saved", os.path.abspath(OUT), "| pages:", back_n)

if __name__ == "__main__":
    main()
